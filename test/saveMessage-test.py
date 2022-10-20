import requests
import json
import unittest
import random
import string
import pymongo
import bson
from decouple import config

class Test_Backend(unittest.TestCase):
    TEST_USER_EMAIL = "TEST_EMAIL"

    @classmethod
    def setUpClass(self) -> None:
        self.base_url = "http://localhost:9000/saveMessage/"
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

    def testMissingBody(self):
        response = requests.post(self.base_url, {})
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json()["message"], "Error with user information")

    def testSuccess(self):
        post_body = { "searchResult": {"service": "s", "result": "nested objects are a pain", "date": "2012-04-23T18:25:43.511Z", "reference": "r"}}
        response = self.session.post(self.base_url, json=post_body)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["message"], "Message saved")
        user = self.collection.find_one({ "email": self.TEST_USER_EMAIL })
        self.assertEqual(user["savedMessages"][0]["result"], "nested objects are a pain")