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
        self.base_url = "http://localhost:9000/changeName"
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
        response = requests.post(self.base_url, {"userID": userID, "newFirstName": "test name"})
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json()["message"], "No user with that ID")

    def testChangeFirstName(self):
        try:
            userID = bson.ObjectId(''.join(random.choices(string.digits, k = 24)))
            self.collection.insert_one({"_id": userID, "firstName": "first test name", "lastName": "last test name"})
            response = requests.post(self.base_url, {"userID": userID, "newFirstName": "test name"})
            self.assertEqual(response.status_code, 200)
            self.assertEqual(response.json()["data"]["newFirstName"], "test name")
            test_user = self.collection.find_one({"_id": userID})
            newFirstName = test_user["firstName"]
            self.assertEqual(newFirstName, "test name")
            self.collection.delete_one({"_id": userID})
        except:
            self.collection.delete_one({"_id": userID})
            self.assertTrue(False)

    def testChangeLastName(self):
        try:
            userID = bson.ObjectId(''.join(random.choices(string.digits, k = 24)))
            self.collection.insert_one({"_id": userID, "firstName": "first name", "lastName": "last name"})
            response = requests.post(self.base_url, {"userID": userID, "newLastName": "test name"})
            self.assertEqual(response.status_code, 200)
            self.assertEqual(response.json()["data"]["newLastName"], "test name")
            test_user = self.collection.find_one({"_id": userID})
            newLastName = test_user["lastName"]
            self.assertEqual(newLastName, "test name")
            self.collection.delete_one({"_id": userID})
        except:
            self.collection.delete_one({"_id": userID})
            self.assertTrue(False)

    def testChangeBoth(self):
        try:
            userID = bson.ObjectId(''.join(random.choices(string.digits, k = 24)))
            self.collection.insert_one({"_id": userID, "firstName": "first name", "lastName": "last name"})
            response = requests.post(self.base_url, {"userID": userID, "newFirstName": "test name first", "newLastName": "test name last"})
            self.assertEqual(response.status_code, 200)
            self.assertEqual(response.json()["data"]["newFirstName"], "test name first")
            self.assertEqual(response.json()["data"]["newLastName"], "test name last")
            test_user = self.collection.find_one({"_id": userID})
            newFirstName = test_user["firstName"]
            newLastName = test_user["lastName"]
            self.assertEqual(newFirstName, "test name first")
            self.assertEqual(newLastName, "test name last")
            self.collection.delete_one({"_id": userID})
        except:
            self.collection.delete_one({"_id": userID})
            self.assertTrue(False)
