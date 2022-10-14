import requests
import json
import unittest
import random
import string
import pymongo
import bson
from decouple import config

class Test_Backend(unittest.TestCase):

    @classmethod
    def setUpClass(self) -> None:
        self.base_url = "http://localhost:9000/saveMessage/"
        connectionString = config("CONNECTION_STRING")
        client = pymongo.MongoClient(connectionString)
        db = client['test']
        self.collection = db['users']

    def testMissingBody(self):
      response = requests.post(self.base_url, {})
      self.assertEqual(response.status_code, 400)
      self.assertEqual(response.json()["message"], "Error with user information")

    def testNonExistentUser(self):
      userID = bson.ObjectId("111111111111111111111111")
      body = { "_id": userID, "searchResult": [{"test": "test"}] }
      response = requests.post(self.base_url, body)
      self.assertEqual(response.status_code, 400)
      self.assertEqual(response.json()["message"], "No user with that ID")

    def testSuccess(self):
      try:
        userID = bson.ObjectId("111111111111111111111111")
        body = { "_id": userID }
        self.collection.insert_one(body)
        post_body = { "_id": userID, "searchResult": ["nested objects are a pain"] }
        response = requests.post(self.base_url, post_body)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["message"], "Message saved")
        user = self.collection.find_one({ "_id": userID })
        self.assertEqual(user["savedMessages"][0], "nested objects are a pain")
        self.collection.delete_one({ "_id": userID })
      except:
        self.collection.delete_one({"_id": userID})
        self.assertTrue(False)