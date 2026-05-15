from django.urls import path, include

from rest_framework.routers import DefaultRouter

from stockmanagement.views import *
from stockmanagement.cypress_helpers import CypressTestView, CypressInstockTestView
from login import urls as login_urls

router = DefaultRouter()
router.register(r'group', GroupViewSet)
router.register(r'item', ItemViewSet)
router.register(r'instock', InstockViewSet)
router.register(r'outstock', OutstockViewSet)


urlpatterns = [
    path('api/', include(router.urls)),
    path('login/', include(login_urls)),
    path('fields/group', GroupFieldView.as_view()),
    path('fields/item', ItemFieldView.as_view()),
    path('fields/instock', InstockFieldView.as_view()),
    path('fields/outstock', OutstockFieldView.as_view()),
    path('cypress', CypressTestView.as_view(), name='cypress-test-helper'),
    path('cypress/instock', CypressInstockTestView.as_view(), name='cypress-instock-helper'),
]