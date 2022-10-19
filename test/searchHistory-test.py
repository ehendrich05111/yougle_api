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
        self.base_url = "http://localhost:9000/searchhistory/store"
        connectionString = config("CONNECTION_STRING")
        client = pymongo.MongoClient(connectionString)
        db = client['test']
        self.collection = db['users']

    def testEmptyBody(self):
        response = requests.post(self.base_url, {})
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.text, "Error with request information")

    def testNonExistentId(self):
        userID = bson.ObjectId("111111111111111111111111")
        search = "test search"
        response = requests.post(self.base_url, {"userID": userID, "search": search})
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.text, "No user with that ID")

    def testEmptyHistory(self):
        try:
            userID = bson.ObjectId(''.join(random.choices(string.digits, k = 24)))
            self.collection.insert_one({"_id": userID, "history": []})
            search = "This is my test search"
            response = requests.post(self.base_url, {"_id": userID, "message": message})
            self.assertEqual(response.status_code, 200)
            self.assertEqual(response.text, "History updated")
            test_user = self.collection.find_one({"_id:": userID})
            history = test_user["history"]
            self.assertEqual(len(history), 1)
            self.assertEqual(history[0], search)
            self.collection.delete_one({"_id": userID})
        except:
            self.collection.delete_one({"_id": userID})

    def testNotEmptyOrFullHistory(self):
        try:
            userID = bson.ObjectId(''.join(random.choices(string.digits, k = 24)))
            self.collection.insert_one({"_id": userID, "history": ['test'] * 50})
            search = "This is my test search"
            response = requests.post(self.base_url, {"_id": userID, "message": message})
            self.assertEqual(response.status_code, 200)
            self.assertEqual(response.text, "History updated")
            test_user = self.collection.find_one({"_id:": userID})
            history = test_user["history"]
            self.assertEqual(len(history), 51)
            self.assertEqual(history[50], search)
            self.collection.delete_one({"_id": userID})
        except:
            self.collection.delete_one({"_id": userID})

    def testFullHistory(self):
        try:
            userID = bson.ObjectId(''.join(random.choices(string.digits, k = 24)))
            self.collection.insert_one({"_id": userID, "history": ["test"] * 100})
            search = "This is my test search"
            response = requests.post(self.base_url, {"_id": userID, "message": message})
            self.assertEqual(response.status_code, 200)
            self.assertEqual(response.text, "History updated")
            test_user = self.collection.find_one({"_id:": userID})
            history = test_user["history"]
            self.assertEqual(len(history), 100)
            self.assertEqual(history[99], search)
            self.collection.delete_one({"_id": userID})
        except:
            self.collection.delete_one({"_id": userID})

    def testNonExistentHistory(self):
        try:
            userID = bson.ObjectId(''.join(random.choices(string.digits, k = 24)))
            self.collection.insert_one({"_id": userID})
            search = "This is my test search"
            response = requests.post(self.base_url, {"_id": userID, "message": message})
            self.assertEqual(response.status_code, 400)
            self.assertEqual(response.text, "Error updating history")
            self.collection.delete_one({"_id": userID})
        except:
            self.collection.delete_one({"_id": userID})

