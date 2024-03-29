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
        self.base_url = "http://localhost:9000/searchHistory/"
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
        self.collection.delete_one({"email": "test change email"})
        self.session.close()

    def testNotSignedIn(self):
        self.session.close()
        response = requests.delete(self.base_url)
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json()["message"], "Please login first!")

    def testNoHistoryToClear(self):
        result = self.session.delete(self.base_url)
        self.assertEqual(result.status_code, 200)
        self.assertEqual(result.json()["message"], "Search history already empty")

    def testSuccess(self):
        self.collection.update_one(
            {"email": self.TEST_USER_EMAIL}, {"$push": {"history": "new entry"}}
        )
        result = self.session.delete(self.base_url)
        self.assertEqual(result.status_code, 200)
        user = self.collection.find_one({"email": self.TEST_USER_EMAIL})
        self.assertEqual(user["history"], [])

    def testSingleNoIndex(self):
        result = self.session.post(self.base_url + "deleteSingle/", {})
        self.assertEqual(result.status_code, 400)
        self.assertEqual(result.json()["message"], "No history element specified")

    def testSingleIndexLow(self):
        result = self.session.post(self.base_url + "deleteSingle/", {"index": "-1"})
        self.assertEqual(result.status_code, 400)
        self.assertEqual(result.json()["message"], "Index out of range")

    def testSingleIndexHigh(self):
        result = self.session.post(self.base_url + "deleteSingle/", {"index": "101"})
        self.assertEqual(result.status_code, 400)
        self.assertEqual(result.json()["message"], "Index out of range")

    def testSingleSuccess(self):
        for i in range(5):
            self.collection.update_one(
                {"email": self.TEST_USER_EMAIL},
                {"$push": {"history": "new entry" + str(i)}},
            )
        result = self.session.post(self.base_url + "deleteSingle/", {"index": "2"})
        self.assertEqual(result.status_code, 200)
        user = self.collection.find_one({"email": self.TEST_USER_EMAIL})
        self.assertEqual(user["history"][2], "new entry3")
