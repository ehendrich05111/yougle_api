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
        self.base_url = "http://localhost:9000/settings/"
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
        self.collection.delete_one({"email": "test change email"})
        self.session.close()

    def testFailure(self):
        self.session.close()
        response = requests.get(self.base_url)
        self.assertEqual(response.status_code, 401)
        self.assertEqual(response.json()["message"], "Please log in first!")

    def testSuccess(self):
        response = self.session.get(self.base_url)
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.json()["data"] != None)