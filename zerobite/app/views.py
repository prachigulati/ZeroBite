from django.shortcuts import render, redirect
from django.contrib import messages
from django.contrib.auth import login, authenticate
from django.contrib.auth.decorators import login_required
from django.contrib.auth.hashers import make_password
from .models import CustomUser, Donation, UserProfile


from django.http import JsonResponse
from django.utils.timezone import now
from django.contrib.auth.decorators import login_required
from django.shortcuts import get_object_or_404
from django.http import JsonResponse, HttpResponseBadRequest


def home(request):
    # Check for login_required parameter to show login modal
    show_login_modal = request.GET.get('login_required') == 'true'
    return render(request, "landing.html", {"show_login_modal": show_login_modal})

def signup_view(request):
    if request.method == "POST":
        username = request.POST.get("username")
        email = request.POST.get("email")
        phone = request.POST.get("phone")
        password1 = request.POST.get("password1")
        password2 = request.POST.get("password2")

        # validations
        if password1 != password2:
            messages.error(request, "Passwords do not match.")
            return redirect("home")

        if CustomUser.objects.filter(username=username).exists():
            messages.error(request, "Username already exists.")
            return redirect("home")

        if CustomUser.objects.filter(email=email).exists():
            messages.error(request, "Email already registered.")
            return redirect("home")

        # create user
        user = CustomUser.objects.create(
            username=username,
            email=email,
            phone=phone,
            password=make_password(password1),  # hash password
        )

        login(request, user)  # auto login after signup
        messages.success(request, f"Welcome {username}, your account has been created!")
        return redirect("donation")   # ✅ redirect to donation instead of dashboard

    return redirect("home")


def login_view(request):
    if request.method == "POST":
        username = request.POST.get("username")
        password = request.POST.get("password")
        user = authenticate(request, username=username, password=password)

        if user is not None:
            login(request, user)
            return redirect("donation")
        else:
            messages.error(request, "Invalid username or password.")
            return redirect("home")
    print("login done")
    return redirect("home")


def rewards(request):
    if request.user.is_authenticated:
        # Get or create user profile
        profile, created = UserProfile.objects.get_or_create(user=request.user)
        
        # Calculate rewards data
        tokens = profile.tokens
        level = profile.level
        streak = profile.streak
        tokens_to_next = profile.get_tokens_to_next_level()
        progress_percentage = profile.get_level_progress_percentage()
        
        context = {
            'tokens': tokens,
            'level': level,
            'streak': streak,
            'tokens_to_next': tokens_to_next,
            'progress_percentage': progress_percentage,
            'total_donations': profile.total_donations,
            'total_pickups': profile.total_pickups,
        }
    else:
        context = {
            'tokens': 0,
            'level': 1,
            'streak': 0,
            'tokens_to_next': 100,
            'progress_percentage': 0,
            'total_donations': 0,
            'total_pickups': 0,
        }
    
    return render(request, "rewards.html", context)

# views.py
from django.shortcuts import get_object_or_404, redirect, render
from django.contrib import messages
from .models import Donation

def pickup_donation(request, donation_id):
    donation = get_object_or_404(Donation, id=donation_id)

    if not donation.qr_code:  # Generate only once
        donation.generate_qr()
        donation.status = "approved"  # you can change status as needed
        donation.save()
        messages.success(request, "QR Code generated successfully.")
    else:
        messages.info(request, "QR Code already exists for this donation.")

    return redirect("donation_detail", donation_id=donation.id)



# views.py
from django.shortcuts import render
from django.contrib.auth.decorators import login_required
from .models import Donation


def dashboard(request):
    if not request.user.is_authenticated:
        # Redirect to home and show login modal
        return redirect('home')
    
    donations = Donation.objects.filter(donor=request.user)
    total = donations.count()
    active = donations.filter(status__in=["pending", "approved"]).count()
    completed = donations.filter(status="completed").count()

    return render(request, "dashboard.html", {
        "donations": donations,
        "total": total,
        "active": active,
        "completed": completed,
    })
    





from django.http import JsonResponse
from django.utils.timezone import now
from django.contrib.auth.decorators import login_required
from django.shortcuts import get_object_or_404
from django.http import JsonResponse, HttpResponseBadRequest

@login_required
def pickup_donation_volunteer(request, donation_id):
    if request.method == "POST":
        donation = get_object_or_404(Donation, id=donation_id)

        if donation.status != "pending":
            return JsonResponse({"success": False, "error": "Donation is not available for pickup."})

        donation.status = "reserved"
        donation.volunteer = request.user  # assign logged-in volunteer
        donation.save()

        return JsonResponse({"success": True, "message": "Donation reserved!"})


def volunteer_dashboard(request):
    if not request.user.is_authenticated:
        # Redirect to home and show login modal
        return redirect('home')
    
    assigned_donations = Donation.objects.filter(volunteer=request.user).order_by("-created_at")
    return render(request, "volunteer.html", {
        "assigned_donations": assigned_donations,
    })


@login_required
def verify_pickup(request, donation_id):
    donation = get_object_or_404(Donation, id=donation_id, volunteer=request.user)

    if donation.status != "reserved":
        return JsonResponse({"success": False, "error": "Donation is not reserved."})

    donation.status = "completed"
    donation.save()

    # Award tokens for successful pickup
    profile, created = UserProfile.objects.get_or_create(user=request.user)
    profile.add_tokens(75, "Successful pickup")  # 75 tokens for completing a pickup
    profile.total_pickups += 1
    profile.update_streak()
    profile.save()

    return JsonResponse({"success": True, "message": "Donation verified and completed!"})


@login_required
def check_donation_status(request, donation_id):
    """Check if a donation has been scanned/picked up"""
    try:
        donation = get_object_or_404(Donation, id=donation_id)
        
        # Only show as scanned if it's completed (actually picked up)
        # Reserved status means it's assigned but not yet picked up
        is_scanned = donation.status == 'completed'
        
        return JsonResponse({
            'success': True,
            'is_scanned': is_scanned,
            'status': donation.status,
            'scanned_by': donation.volunteer.username if donation.volunteer else None,
            'is_reserved': donation.status == 'reserved',
            'reserved_by': donation.volunteer.username if donation.volunteer and donation.status == 'reserved' else None
        })
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': str(e)
        })



# views.py
from django.shortcuts import get_object_or_404
from django.http import JsonResponse
from pyzbar.pyzbar import decode
from PIL import Image
from .models import Donation
from django.contrib.auth.decorators import login_required

@login_required
def upload_qr(request, donation_id):
    donation = get_object_or_404(Donation, id=donation_id, volunteer=request.user)

    if request.method == "POST" and request.FILES.get("qr_image"):
        qr_image = request.FILES["qr_image"]
        image = Image.open(qr_image)
        decoded = decode(image)

        if not decoded:
            return JsonResponse({"success": False, "error": "No QR code detected."})

        qr_data = decoded[0].data.decode("utf-8")
        expected_data = f"/verify/{donation.id}/"  # must match the QR generated

        if qr_data.strip() == expected_data.strip():
            donation.status = "completed"
            donation.save()
            return JsonResponse({"success": True, "message": "Pickup verified!"})
        else:
            return JsonResponse({"success": False, "error": "QR code does not match this donation."})

    return JsonResponse({"success": False, "error": "No file uploaded."})




def donations(request):
    donations = Donation.objects.all().order_by('-created_at')
    return render(request, 'donation.html', {'donations': donations})



# views.py
from django.views.decorators.csrf import csrf_exempt
from django.http import JsonResponse
from django.conf import settings
from .models import Donation, CustomUser  # use your custom user
from django.core.files import File
from io import BytesIO
import qrcode

@csrf_exempt
def api_create_donation(request):
    if request.method == 'POST':
        try:
            print("Received donation form submission")
            print("POST data:", request.POST)
            print("FILES data:", request.FILES)
            
            # Get form data
            phone = request.POST.get('phone')
            email = request.POST.get('email')
            donor_name = request.POST.get('donorName', '')
            item_name = request.POST.get('itemName')
            category = request.POST.get('category')
            quantity = request.POST.get('quantity')
            unit = request.POST.get('unit')
            pickup_address = request.POST.get('pickupAddress')
            date = request.POST.get('date')
            time = request.POST.get('time')
            notes = request.POST.get('notes')
            
            print(f"Form data - Phone: {phone}, Email: {email}, Item: {item_name}")

            # Handle file uploads
            food_image = request.FILES.get('foodImage')
            packaging_image = request.FILES.get('packagingImage')

            # Find or create user by email
            user, created = CustomUser.objects.get_or_create(
                email=email,
                defaults={
                    'username': email.split('@')[0],
                    'first_name': donor_name,
                    'is_active': True,
                    'phone': phone,
                }
            )

            # Update phone if user already exists but phone is missing
            if not created and phone and user.phone != phone:
                user.phone = phone
                user.save(update_fields=['phone'])

            # Validate required fields
            if not all([phone, email, item_name, category, quantity, unit, pickup_address, date, time]):
                return JsonResponse({'success': False, 'message': 'Missing required fields'})
            
            # Validate category is in choices
            valid_categories = [choice[0] for choice in Donation.FOOD_TYPE_CHOICES]
            if category not in valid_categories:
                return JsonResponse({'success': False, 'message': f'Invalid category: {category}'})
            
            # Validate unit is in choices
            valid_units = [choice[0] for choice in Donation.UNIT_CHOICES]
            if unit not in valid_units:
                return JsonResponse({'success': False, 'message': f'Invalid unit: {unit}'})

            # Create donation
            donation = Donation.objects.create(
                donor=user,
                phone=phone,
                email=email,
                item_name=item_name,
                food_type=category,
                quantity=int(quantity) if quantity else 0,
                unit=unit,
                pickup_location=pickup_address,
                date_available=date,
                time_available=time,
                notes=notes,
                status='pending'
            )
            
            print(f"Created donation: {donation.id} for user: {user.email}")

            # Handle file uploads
            if food_image:
                donation.food_image = food_image
            if packaging_image:
                donation.packaging_image = packaging_image

            donation.save()  # QR code will be auto-generated by save()

            # Award tokens for donation
            profile, created = UserProfile.objects.get_or_create(user=user)
            profile.add_tokens(50, "Donation created")  # 50 tokens for creating a donation
            profile.total_donations += 1
            profile.update_streak()
            profile.save()

            return JsonResponse({'success': True, 'message': 'Donation submitted successfully!'})

        except Exception as e:
            print(f"Error creating donation: {str(e)}")
            import traceback
            traceback.print_exc()
            return JsonResponse({'success': False, 'message': f'Error: {str(e)}'})

    return JsonResponse({'success': False, 'message': 'Method not allowed'})




def donate(request):
    if not request.user.is_authenticated:
        # Redirect to home and show login modal
        return redirect('home')
    return render(request, 'donate.html')




def api_donations(request):
    donations = Donation.objects.all().order_by('-created_at')
    donations_data = []
    
    for donation in donations:
        donations_data.append({
            'id': donation.id,
            'item_name': donation.item_name,
            'food_type': donation.food_type,
            'quantity': donation.quantity,
            'unit': donation.unit,
            'pickup_location': donation.pickup_location,
            'date_available': donation.date_available.isoformat(),
            'time_available': donation.time_available.isoformat(),
            'food_image': donation.food_image.url if donation.food_image else None,
            'packaging_image': donation.packaging_image.url if donation.packaging_image else None,
            'notes': donation.notes,
            'status': donation.status,
            'created_at': donation.created_at.isoformat(),
            'donor_name': donation.donor.username
        })
    
    return JsonResponse({'donations': donations_data})

def analytics(request):
    return render(request, "analytics.html")