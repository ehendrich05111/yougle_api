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
        self.base_url = "http://localhost:9000/disconnectService/"
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
      response = self.session.post(self.base_url, {})
      self.assertEqual(response.status_code, 400)
      self.assertEqual(response.json()["message"], "Error with request information")

    def testDisconnectNonConnectedService(self):
        self.collection.update_one({"email": self.TEST_USER_EMAIL}, {"$set": {"credentials": [{"_id": bson.ObjectId("1" * 24)}, {"_id": bson.ObjectId("2" * 24)}]}})
        response = self.session.post(self.base_url, { "serviceId": "3" * 24 })
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json()["message"], "Attempted to disconnect a non-connected service")

    def testDisconnectConnectedServiceMultipleConnectedServices(self):
        self.collection.update_one({"email": self.TEST_USER_EMAIL}, {"$set": {"credentials": [{"_id": bson.ObjectId("1" * 24)}, {"_id": bson.ObjectId("2" * 24)}, {"_id": bson.ObjectId("3" * 24)}]}})
        response = self.session.post(self.base_url, {"serviceId": "1" * 24 })
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["message"], "Service Disconnected")
        user = self.collection.find_one({"email": self.TEST_USER_EMAIL})
        self.assertEqual(len(user["credentials"]), 2)
        self.assertEqual(user["credentials"][0]["_id"], bson.ObjectId("2" * 24))

    def testDisconnectConnectedServiceOneConnectedServices(self):
        self.collection.update_one({"email": self.TEST_USER_EMAIL}, {"$set": {"credentials": [{"_id": bson.ObjectId("1" * 24)}]}})
        response = self.session.post(self.base_url, { "serviceId": "1" * 24 })
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["message"], "Service Disconnected")
        user = self.collection.find_one({"email": self.TEST_USER_EMAIL})
        self.assertEqual(len(user["credentials"]), 0)