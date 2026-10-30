from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase

User = get_user_model()


class AuthenticationAPITests(APITestCase):
    def setUp(self):
        self.register_url = "/api/auth/register/"
        self.token_url = "/api/auth/token/"
        self.me_url = "/api/auth/me/"

        self.user_data = {
            "username": "student_test",
            "email": "student@example.com",
            "first_name": "Test",
            "last_name": "Student",
            "password": "Safe-Test-Password-9472!",
            "password_confirm": "Safe-Test-Password-9472!",
        }

    def test_registration_creates_student_with_hashed_password(self):
        response = self.client.post(
            self.register_url,
            self.user_data,
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        user = User.objects.get(username="student_test")
        self.assertEqual(user.role, User.Role.STUDENT)
        self.assertTrue(user.check_password(self.user_data["password"]))
        self.assertNotEqual(user.password, self.user_data["password"])

    def test_registration_rejects_mismatched_passwords(self):
        data = {
            **self.user_data,
            "password_confirm": "Different-Password-123!",
        }

        response = self.client.post(
            self.register_url,
            data,
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(User.objects.filter(username="student_test").exists())

    def test_registration_rejects_weak_password(self):
        data = {
            **self.user_data,
            "password": "123",
            "password_confirm": "123",
        }

        response = self.client.post(
            self.register_url,
            data,
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(User.objects.filter(username="student_test").exists())

    def test_login_returns_jwt_tokens(self):
        User.objects.create_user(
            username="student_test",
            email="student@example.com",
            password=self.user_data["password"],
        )

        response = self.client.post(
            self.token_url,
            {
                "username": "student_test",
                "password": self.user_data["password"],
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("access", response.data)
        self.assertIn("refresh", response.data)

    def test_me_requires_authentication(self):
        response = self.client.get(self.me_url)

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_me_returns_authenticated_user(self):
        user = User.objects.create_user(
            username="student_test",
            email="student@example.com",
            password=self.user_data["password"],
        )

        login_response = self.client.post(
            self.token_url,
            {
                "username": "student_test",
                "password": self.user_data["password"],
            },
            format="json",
        )

        self.assertEqual(login_response.status_code, status.HTTP_200_OK)

        self.client.credentials(
            HTTP_AUTHORIZATION=f"Bearer {login_response.data['access']}"
        )
        response = self.client.get(self.me_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["id"], user.id)
        self.assertEqual(response.data["role"], User.Role.STUDENT)
