import requests
import json
import unittest
import random
import string
import pymongo
from decouple import config
import bson

class Test_Backend(unittest.TestCase):

    @classmethod
    def setUpClass(self) -> None:
        self.base_url = "http://localhost:9000/disconnectService/"
        connectionString = config("CONNECTION_STRING")
        client = pymongo.MongoClient(connectionString)
        db = client['test']
        self.collection = db['users']

    def testMissingBody(self):
      response = requests.post(self.base_url, {})
      self.assertEqual(response.status_code, 400)
      self.assertEqual(response.json()["message"], "Error with request information")

    def testNoUser(self):
        userID = bson.ObjectId("111111111111111111111111")
        response = requests.post(self.base_url, {"id": userID, "serviceName": "Discord"})
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json()["message"], "User with that id does not exist")
    
    def testDisconnectNonConnectedService(self):
        try:
            userID = bson.ObjectId("111111111111111111111111")
            body = { "_id": userID, "credentials": [{"service": "test"}, {"service": "test2"}] }
            self.collection.insert_one(body)
            response = requests.post(self.base_url, { "id": userID, "serviceName": "fakeService" })
            self.assertEqual(response.status_code, 400)
            self.assertEqual(response.json()["message"], "Attempted to disconnect a non-connected service")
            self.collection.delete_one({"_id": userID})
        except:
            self.collection.delete_one({"_id": userID})
            self.assertTrue(False)

    def testDisconnectConnectedServiceMultipleConnectedServices(self):
        try:
            userID = bson.ObjectId("111111111111111111111111")
            body = { "_id": userID, "credentials": [{"service": "test"}, {"service": "test2"}, {"service": "test3"}] }
            self.collection.insert_one(body)
            response = requests.post(self.base_url, { "id": userID, "serviceName": "test" })
            self.assertEqual(response.status_code, 200)
            self.assertEqual(response.json()["message"], "Service Disconnected")
            user = self.collection.find_one({"_id": userID})
            self.assertEqual(len(user["credentials"]), 2)
            self.assertEqual(user["credentials"][0]["service"], "test2")
            self.collection.delete_one({"_id": userID})
        except:
            self.collection.delete_one({"_id": userID})
            self.assertTrue(False)

    def testDisconnectConnectedServiceOneConnectedServices(self):
        try:
            userID = bson.ObjectId("111111111111111111111111")
            body = { "_id": userID, "credentials": [{"service": "test"}] }
            self.collection.insert_one(body)
            response = requests.post(self.base_url, { "id": userID, "serviceName": "test" })
            self.assertEqual(response.status_code, 200)
            self.assertEqual(response.json()["message"], "Service Disconnected")
            user = self.collection.find_one({"_id": userID})
            self.assertEqual(len(user["credentials"]), 0)
            self.collection.delete_one({"_id": userID})
        except:
            self.collection.delete_one({"_id": userID})
            self.assertTrue(False)