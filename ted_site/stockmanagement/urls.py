from django.urls import path

from stockmanagement.views import StockDisplay

urlpatterns = [
    path('', StockDisplay.as_view(), name='stock_display'),
]