from django.urls import path

from about.views import HomeView, AboutView

urlpatterns = [
    path('', HomeView.as_view(), name='index'),
    path('about/', AboutView.as_view(), name='about'),
]