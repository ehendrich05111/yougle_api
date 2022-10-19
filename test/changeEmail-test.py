import requests
import json
import unittest
import bson
import random
import string
import pymongo
from decouple import config

class Test_Backend(unittest.TestCase):

    @classmethod
    def setUpClass(self) -> None:
        self.base_url = "http://localhost:9000/changeEmail"
        connectionString = config("CONNECTION_STRING")
        client = pymongo.MongoClient(connectionString)
        db = client['test']
        self.collection = db['users']

    def testEmptyBody(self):
        response = requests.post(self.base_url, {})
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json()["message"], "Error with request information")

    def testNonExistentId(self):
        userID = bson.ObjectId("111111111111111111111111")
        response = requests.post(self.base_url, {"userID": userID, "newEmail": "test email"})
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json()["message"], "No user with that ID")

    def testEmailAlreadyUsed(self):
        try:
            userID1 = bson.ObjectId(''.join(random.choices(string.digits, k = 24)))
            userID2 = bson.ObjectId(''.join(random.choices(string.digits, k = 24)))
            self.collection.insert_one({"_id": userID1, "email": "test email"})
            self.collection.insert_one({"_id": userID2, "email": "existing email"})
            response = requests.post(self.base_url, {"userID": userID1, "newEmail": "existing email"})
            self.assertEqual(response.status_code, 400)
            self.assertEqual(response.json()["message"], "A user with that email already exists")
            self.collection.delete_one({"_id": userID1})
            self.collection.delete_one({"_id": userID2})
        except:
            self.collection.delete_one({"_id": userID1})
            self.collection.delete_one({"_id": userID2})
            self.assertTrue(False)

    def testSuccess(self):
        try:
            userID = bson.ObjectId(''.join(random.choices(string.digits, k = 24)))
            self.collection.insert_one({"_id": userID, "email": "test email"})
            response = requests.post(self.base_url, {"userID": userID, "newEmail": "new email"})
            self.assertEqual(response.status_code, 200)
            self.assertEqual(response.json()["data"]["newEmail"], "new email")
            test_user = self.collection.find_one({"_id": userID})
            self.assertEqual(test_user["email"], "new email")
            self.collection.delete_one({"_id": userID})
        except:
            self.collection.delete_one({"_id": userID})
            self.assertTrue(False)