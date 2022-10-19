import requests
import json
import unittest
import random
import string
import pymongo
from decouple import config
import bson
import jwt

class Test_Backend(unittest.TestCase):
    TEST_USER_EMAIL = "TEST_EMAIL"


    @classmethod
    def setUpClass(self) -> None:
        self.base_url = "http://localhost:9000/changeName/"
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


    def testChangeFirstName(self):
        response = self.session.post(self.base_url, {"newFirstName": "test name"})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["data"]["user"]["firstName"], "test name")
        test_user = self.collection.find_one({"email": self.TEST_USER_EMAIL})
        newFirstName = test_user["firstName"]
        self.assertEqual(newFirstName, "test name")

    def testChangeLastName(self):
        response = self.session.post(self.base_url, {"newLastName": "test name"})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["data"]["user"]["lastName"], "test name")
        test_user = self.collection.find_one({"email": self.TEST_USER_EMAIL})
        newFirstName = test_user["firstName"]
        self.assertEqual(newFirstName, "test name")

    def testChangeBothNames(self):
        response = self.session.post(self.base_url, {"newFirstName": "test name 1", "newLastName": "test name 2"})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["data"]["user"]["firstName"], "test name 1")
        self.assertEqual(response.json()["data"]["user"]["lastName"], "test name 2")
        test_user = self.collection.find_one({"email": self.TEST_USER_EMAIL})
        newFirstName = test_user["firstName"]
        newLastName = test_user["lastName"]
        self.assertEqual(newFirstName, "test name 1")
        self.assertEqual(newLastName, "test name 2")