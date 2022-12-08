import time
import requests
import json
import unittest
import random
import string
import pymongo
from decouple import config


class Test_Backend(unittest.TestCase):

    TEST_USER_EMAIL = "myemail6@gmail.com"
    TEST_USER_PASSWORD = "Mypassword6!"

    @classmethod
    def setUpClass(self) -> None:
        self.base_url = "http://localhost:9000/"
        connectionString = config("CONNECTION_STRING")
        client = pymongo.MongoClient(connectionString)
        db = client["test"]
        self.collection = db["users"]

        self.session = requests.Session()
        self.session.post(
            "http://localhost:9000/signup",
            {
                "email": self.TEST_USER_EMAIL,
                "password": self.TEST_USER_PASSWORD,
                "firstName": "firstname5",
                "lastName": "lastname5",
            },
        )
        self.collection.update_one(
            {"email": self.TEST_USER_EMAIL}, {"$set": {"isAdmin": True}}
        )  # make the user an admin

        resp = self.session.post(
            "http://localhost:9000/signIn",
            {"email": self.TEST_USER_EMAIL, "password": self.TEST_USER_PASSWORD},
        )
        token = resp.json()["data"]["token"]
        self.session.headers.update({"Authorization": "JWT " + token})

    @classmethod
    def tearDownClass(self) -> None:
        self.collection.delete_one({"email": self.TEST_USER_EMAIL})
        self.session.close()

    def testAccessRestricted(self):

        nonadmin_session = requests.Session()

        # create non admin user
        nonadmin_session.post(
            "http://localhost:9000/signup",
            {
                "email": "iamnotadmin@gmail.com",
                "password": self.TEST_USER_PASSWORD,
                "firstName": "firstname5",
                "lastName": "lastname5",
            },
        )
        resp = nonadmin_session.post(
            "http://localhost:9000/signIn",
            {"email": "iamnotadmin@gmail.com", "password": self.TEST_USER_PASSWORD},
        )
        token = resp.json()["data"]["token"]
        nonadmin_session.headers.update({"Authorization": "JWT " + token})

        response = nonadmin_session.get(self.base_url + "admin/accounts")
        self.assertEqual(response.status_code, 401)
        self.assertEqual(
            response.json()["message"], "You must be an administrator to access this"
        )
        self.collection.delete_one({"email": "iamnotadmin@gmail.com"})
        nonadmin_session.close()

    def testNoQueryParams(self):
        response = self.session.get(self.base_url + "admin/accounts")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.json()["message"], "Successfully retrieved the number of accounts"
        )

    def testQueryParams(self):
        response = self.session.get(
            self.base_url + "admin/accounts?start=1667534400&end=1668643013"
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.json()["message"], "Successfully retrieved the number of accounts"
        )
        self.assertEqual(response.json()["data"], 12)

    def testMalformedQuery(self):
        response = self.session.get(
            self.base_url + "admin/accounts?start=1667534400&e33iijnd=1668643013"
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.json()["message"], "Successfully retrieved the number of accounts"
        )
