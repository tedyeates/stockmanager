from django.urls import path, include

from rest_framework.routers import DefaultRouter

from stockmanagement.views import *
from login import urls as login_urls

router = DefaultRouter()
router.register(r'groups', GroupViewSet)
router.register(r'items', ItemViewSet)
router.register(r'instock', InstockViewSet)
router.register(r'outstock', OutstockViewSet)

urlpatterns = [
    path('api/', include(router.urls)),
    path('login/', include(login_urls)),
    path('fields/groups', GroupFieldView.as_view()),
    path('fields/items', ItemFieldView.as_view()),
    path('fields/instock', InstockFieldView.as_view()),
    path('fields/outstock', OutstockFieldView.as_view())
]