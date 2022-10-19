import requests
import json
import unittest
import random
import string
import pymongo
from decouple import config

class Test_Backend(unittest.TestCase):

    @classmethod
    def setUpClass(self) -> None:
        self.base_url = "http://localhost:9000/"
        connectionString = config("CONNECTION_STRING")
        client = pymongo.MongoClient(connectionString)
        db = client['test']
        self.collection = db['users']

    def testMissingBody(self):
      response = requests.post(self.base_url + "signup", {})
      self.assertEqual(response.status_code, 400)
      self.assertEqual(response.json()["message"], "Please provide all required information")

    def testPartialBody(self):
      body = { "firstName": "Evan", "lastName": "Hendrich", "password": "test_password"}
      response = requests.post(self.base_url + "signup", body)
      self.assertEqual(response.status_code, 400)
      self.assertEqual(response.json()["message"], "Please provide all required information")

    def testEmptyStrings(self):
      body = { "firstName": "", "lastName": "", "email": "", "password": ""}
      response = requests.post(self.base_url + "signup", body)
      self.assertEqual(response.status_code, 400)
      self.assertEqual(response.json()["message"], "Please provide all required information")

    def testExistingUser(self):
      body = { "firstName": "Evan", "lastName": "Hendrich", "email": "bobsmith@gmail.com", "password": "test_password"}
      response = requests.post(self.base_url + "signup", body)
      self.assertEqual(response.status_code, 400)
      self.assertEqual(response.json()["message"], "A user with that email already exists")

    def testValidUser(self):
      try:
        email = ''.join(random.choices(string.ascii_letters, k = 12))
        body = { "firstName": "test", "lastName": "user", "email": email, "password": "test_password"}
        response = requests.post(self.base_url + "signup", body)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.text, "Account created succesfully")
        user = self.collection.find_one({"email": email})
        self.assertTrue(user != None)
        self.collection.delete_one({"email": email})
      except:
        self.collection.delete_one({"email": email})
