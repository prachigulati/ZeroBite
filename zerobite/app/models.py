# app/models.py
from django.db import models
from django.contrib.auth.models import AbstractUser
from django.core.validators import MinValueValidator
from django.conf import settings
from datetime import datetime
from io import BytesIO
from django.core.files import File
from django.urls import reverse
from django.db.models.signals import post_save
from django.dispatch import receiver
import qrcode

# Check if qrcode is available
try:
    import qrcode
    QRCODE_AVAILABLE = True
except ImportError:
    QRCODE_AVAILABLE = False


# Custom User model
class CustomUser(AbstractUser):
    email = models.EmailField(unique=True)
    phone = models.CharField(max_length=15, blank=True, null=True)

    def __str__(self):
        return self.username


# User Profile for rewards system
class UserProfile(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE, 
        related_name='profile'
    )
    tokens = models.IntegerField(default=0)
    level = models.IntegerField(default=1)
    streak = models.IntegerField(default=0)
    last_activity_date = models.DateField(null=True, blank=True)
    total_donations = models.IntegerField(default=0)
    total_pickups = models.IntegerField(default=0)
    
    # Level requirements (tokens needed for each level)
    LEVEL_REQUIREMENTS = {
        1: 0,      # Level 1: 0 tokens
        2: 100,    # Level 2: 100 tokens
        3: 250,    # Level 3: 250 tokens
        4: 500,    # Level 4: 500 tokens
        5: 1000,   # Level 5: 1000 tokens
        6: 2000,   # Level 6: 2000 tokens
        7: 3500,   # Level 7: 3500 tokens
        8: 5000,   # Level 8: 5000 tokens
        9: 7500,   # Level 9: 7500 tokens
        10: 10000, # Level 10: 10000 tokens
    }
    
    def add_tokens(self, amount, reason=""):
        """Add tokens and check for level up"""
        self.tokens += amount
        self.update_level()
        self.save()
        
    def update_level(self):
        """Update user level based on current tokens"""
        new_level = 1
        for level, required_tokens in self.LEVEL_REQUIREMENTS.items():
            if self.tokens >= required_tokens:
                new_level = level
            else:
                break
        
        if new_level > self.level:
            self.level = new_level
            return True  # Level up occurred
        return False
    
    def get_tokens_to_next_level(self):
        """Get tokens needed for next level"""
        current_level = self.level
        next_level = current_level + 1
        
        if next_level in self.LEVEL_REQUIREMENTS:
            required = self.LEVEL_REQUIREMENTS[next_level]
            return max(0, required - self.tokens)
        return 0
    
    def get_level_progress_percentage(self):
        """Get progress percentage to next level"""
        current_level = self.level
        next_level = current_level + 1
        
        if next_level not in self.LEVEL_REQUIREMENTS:
            return 100  # Max level reached
        
        current_required = self.LEVEL_REQUIREMENTS[current_level]
        next_required = self.LEVEL_REQUIREMENTS[next_level]
        
        if next_required == current_required:
            return 100
        
        progress = self.tokens - current_required
        total_needed = next_required - current_required
        
        return min(100, (progress / total_needed) * 100)
    
    def update_streak(self):
        """Update daily streak"""
        from datetime import date
        today = date.today()
        
        if self.last_activity_date:
            if (today - self.last_activity_date).days == 1:
                # Consecutive day
                self.streak += 1
            elif (today - self.last_activity_date).days > 1:
                # Streak broken
                self.streak = 1
        else:
            # First activity
            self.streak = 1
        
        self.last_activity_date = today
        self.save()
    
    def __str__(self):
        return f"{self.user.username} - Level {self.level} ({self.tokens} tokens)"


# Donation model
class Donation(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('completed', 'Completed'),
        ('expired', 'Expired'),
        ('reserved', 'Reserved'),
    ]

    FOOD_TYPE_CHOICES = [
        ('Cooked Meals', 'Cooked Meals'),
        ('Bakery', 'Bakery'),
        ('Produce', 'Produce'),
        ('Dairy', 'Dairy'),
        ('Packaged', 'Packaged'),
    ]

    UNIT_CHOICES = [
        ('portions', 'Portions'),
        ('kg', 'kg'),
        ('loaves', 'Loaves'),
        ('litres', 'Litres'),
        ('packs', 'Packs'),
    ]

    donor = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE, 
        related_name='donations'
    )
    phone = models.CharField(max_length=20)
    email = models.EmailField()
    item_name = models.CharField(max_length=200)
    food_type = models.CharField(max_length=50, choices=FOOD_TYPE_CHOICES)
    quantity = models.IntegerField(validators=[MinValueValidator(1)])
    unit = models.CharField(max_length=20, choices=UNIT_CHOICES)
    pickup_location = models.TextField()
    date_available = models.DateField()
    time_available = models.TimeField()
    food_image = models.ImageField(upload_to='donations/food/', blank=True, null=True)
    packaging_image = models.ImageField(upload_to='donations/packaging/', blank=True, null=True)
    notes = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    qr_code = models.ImageField(upload_to="donations/qrcodes/", blank=True, null=True)
    volunteer = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True, 
        related_name='assigned_donations'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def generate_qr(self, request=None):
        """Generate and save QR code for verification."""
        if not QRCODE_AVAILABLE:
            # If qrcode is not available, skip QR generation
            return
            
        if request:
            verify_url = request.build_absolute_uri(
                reverse("verify_donation", args=[self.id])
            )
        else:
            verify_url = f"/verify/{self.id}/"

        qr = qrcode.make(verify_url)
        buffer = BytesIO()
        qr.save(buffer, format="PNG")
        filename = f"donation_{self.id}_qr.png"
        self.qr_code.save(filename, File(buffer), save=False)
        buffer.close()

    def save(self, *args, **kwargs):
        """Override save to auto-generate QR if missing."""
        super().save(*args, **kwargs)

        if not self.qr_code and QRCODE_AVAILABLE:
            self.generate_qr()
            super().save(update_fields=["qr_code"])

    def __str__(self):
        return f"{self.item_name} by {self.donor.username}"

    class Meta:
        db_table = 'zerobite_donations'
        ordering = ['-created_at']


# Signal to create UserProfile when user is created
@receiver(post_save, sender=settings.AUTH_USER_MODEL)
def create_user_profile(sender, instance, created, **kwargs):
    if created:
        UserProfile.objects.create(user=instance)


@receiver(post_save, sender=settings.AUTH_USER_MODEL)
def save_user_profile(sender, instance, **kwargs):
    if hasattr(instance, 'profile'):
        instance.profile.save()
    else:
        UserProfile.objects.create(user=instance)
