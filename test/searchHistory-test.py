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
        self.base_url = "http://localhost:9000/searchhistory/"
        connectionString = config("CONNECTION_STRING")
        client = pymongo.MongoClient(connectionString)
        db = client["test"]
        self.collection = db["users"]

        self.session = requests.Session()
        self.session.post(
            "http://localhost:9000/signUp",
            {
                "email": self.TEST_USER_EMAIL,
                "password": "qwertyuiop1!",
                "firstName": "firstName",
                "lastName": "lastName",
            },
        )
        resp = self.session.post(
            "http://localhost:9000/signIn",
            {"email": self.TEST_USER_EMAIL, "password": "qwertyuiop1!"},
        )
        token = resp.json()["data"]["token"]

        self.session.headers.update({"Authorization": "JWT " + token})

    @classmethod
    def tearDownClass(self) -> None:
        self.collection.delete_one({"email": self.TEST_USER_EMAIL})
        self.session.close()

    def testEmptyBody(self):
        response = self.session.post(self.base_url, {})
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json()["message"], "Error with request information")

    def testEmptyHistory(self):
        self.collection.update_one(
            {"email": self.TEST_USER_EMAIL}, {"$set": {"history": []}}
        )
        search = "This is my test search"
        response = self.session.post(self.base_url, {"query": search})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["message"], "History updated")
        test_user = self.collection.find_one({"email": self.TEST_USER_EMAIL})
        history = test_user["history"]
        self.assertEqual(len(history), 1)
        self.assertEqual(history[0], search)

    def testNotEmptyOrFullHistory(self):
        self.collection.update_one(
            {"email": self.TEST_USER_EMAIL}, {"$set": {"history": ["test"] * 50}}
        )
        search = "This is my test search"
        response = self.session.post(self.base_url, {"query": search})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["message"], "History updated")
        test_user = self.collection.find_one({"email": self.TEST_USER_EMAIL})
        history = test_user["history"]
        self.assertEqual(len(history), 51)
        self.assertEqual(history[50], search)

    def testFullHistory(self):
        self.collection.update_one(
            {"email": self.TEST_USER_EMAIL}, {"$set": {"history": ["test"] * 100}}
        )
        search = "This is my test search"
        response = self.session.post(self.base_url, {"query": search})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["message"], "History updated")
        test_user = self.collection.find_one({"email": self.TEST_USER_EMAIL})
        history = test_user["history"]
        self.assertEqual(len(history), 100)
        self.assertEqual(history[99], search)
