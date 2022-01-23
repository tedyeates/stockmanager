from django.urls import path

from login.views import TokenAuthentication

urlpatterns = [
    path('', TokenAuthentication.as_view())
]