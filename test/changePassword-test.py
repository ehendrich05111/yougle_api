import requests
import json
import unittest
import bson
import random
import string
import pymongo
from decouple import config

class Test_Backend(unittest.TestCase):
    TEST_USER_EMAIL = "TEST_EMAIL"

    @classmethod
    def setUpClass(self) -> None:
        self.base_url = "http://localhost:9000/changePassword/"
        connectionString = config("CONNECTION_STRING")
        client = pymongo.MongoClient(connectionString)
        db = client['test']
        self.collection = db['users']

        self.session = requests.Session()
        self.session.post("http://localhost:9000/signUp", {"email": self.TEST_USER_EMAIL, "password": "qwertyuiop1!", "firstName": "firstName", "lastName": "lastName"})
        resp = self.session.post("http://localhost:9000/signIn", {"email": self.TEST_USER_EMAIL, "password": "qwertyuiop1!"})
        token = resp.json()['data']['token']

        self.session.headers.update({'Authorization': 'JWT ' + token})

    @classmethod
    def tearDownClass(self) -> None:
        self.collection.delete_one({"email": self.TEST_USER_EMAIL})
        self.session.close()

    def testEmptyBody(self):
        response = requests.post(self.base_url, {})
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json()["message"], "Error with request information")

    def testIncorrectOldPassword(self):
        response = self.session.post(self.base_url, {"oldPassword": "wrong password", "newPassword": "new password"})
        self.assertEqual(response.status_code, 401)
        self.assertEqual(response.json()["message"], "Incorrect old password")

    def testInvalidNewPassword(self):
        response = self.session.post(self.base_url, {"oldPassword": "qwertyuiop1!", "newPassword": "test"})
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json()["message"], "Invalid password. Must be 8 characters or longer, contain a mix of letters, numbers, and symbols, and not contain email or name.")

    def testSameNewPassword(self):
        response = self.session.post(self.base_url, {"oldPassword": "qwertyuiop1!", "newPassword": "qwertyuiop1!"})
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json()["message"], "New password can not be the same as old password")

    def testSuccess(self):
        response = self.session.post(self.base_url, {"oldPassword": "qwertyuiop1!", "newPassword": "password2!"})
        self.assertEqual(response.status_code, 200)
        verify_result = requests.post("http://localhost:9000/signin", {"email": self.TEST_USER_EMAIL, "password": "password1!"})
        self.assertEqual(verify_result.json()["status"], "error")
        self.assertEqual(verify_result.json()["message"], "Incorrect email or password.")
        verify_result = requests.post("http://localhost:9000/signin", {"email": self.TEST_USER_EMAIL, "password": "password2!"})
        self.assertEqual(verify_result.json()["status"], "success")

