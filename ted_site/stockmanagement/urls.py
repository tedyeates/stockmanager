from django.urls import path

from stockmanagement.views import StockDisplay, AddData

urlpatterns = [
    path('', StockDisplay.as_view(), name='stock_display'),
    path('add/', AddData.as_view(), name='stock_add')
]