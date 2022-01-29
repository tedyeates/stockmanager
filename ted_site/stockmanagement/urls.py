from django.urls import path, include

from rest_framework.routers import DefaultRouter

from stockmanagement.views import *

router = DefaultRouter()
router.register(r'groups', GroupViewSet)
router.register(r'items', ItemViewSet)
router.register(r'instock', InstockViewSet)
router.register(r'outstock', OutstockViewSet)

urlpatterns = [
    path('api/', include(router.urls)),
    path('fields/groups', GroupFieldView.as_view()),
    path('fields/items', ItemFieldView.as_view()),
    path('fields/stocks', StockFieldView.as_view())
]