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
        self.base_url = "http://localhost:9000/signin"
        connectionString = config("CONNECTION_STRING")
        client = pymongo.MongoClient(connectionString)
        db = client['test']
        self.collection = db['users']

    def testMissingBody(self):
      response = requests.post(self.base_url, {})
      self.assertEqual(response.status_code, 400)
      self.assertEqual(response.json()["message"], "Error with request information")

    def testMissingEmail(self):
      body = {"password": "pl@ceh0lderpw"}
      response = requests.post(self.base_url, body)
      self.assertEqual(response.status_code, 400)
      self.assertEqual(response.json()["message"], "Error with request information")

    def testMissingPassword(self):
      body = {"email": "signin@test.com"}
      response = requests.post(self.base_url, body)
      self.assertEqual(response.status_code, 400)
      self.assertEqual(response.json()["message"], "Error with request information")

    def testEmptyStrings(self):
      body = { "email": "", "password": ""}
      response = requests.post(self.base_url, body)
      self.assertEqual(response.status_code, 400)
      self.assertEqual(response.json()["message"], "Error with request information")

    def testValidUser(self):
      body = { "email": "sigin@test.com", "password": "pl@ceh0lderpw"}
      response = requests.post("http://localhost:9000/signUp", {"email": body["email"], "password": body["password"], "firstName": "firstName", "lastName": "lastName"})
      self.assertEqual(response.status_code, 200)
      response = requests.post(self.base_url, body)
      self.assertEqual(response.status_code, 200)
      self.collection.delete_one({"email": body["email"]})
