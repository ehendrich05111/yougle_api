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

    def testMissingEmail(self):
        response = requests.post(self.base_url + "deleteAccount", {})
        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            response.json()["message"], "Missing email in Delete Request API call")

    def testNonexistentUser(self):
        body = {"email": "fakeemail001@yahoo.com"}
        response = requests.post(self.base_url + "deleteAccount", body)
        self.assertEqual(response.status_code, 401)
        self.assertEqual(
            response.json()["message"], "No user with that email exists")

    def testMalformedBody(self):
        body = {"Email": "mysampleemail@gmail.com"}
        response = requests.post(self.base_url + "deleteAccount", body)
        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            response.json()["message"], "Missing email in Delete Request API call")

    def testNoBodyProvided(self):
        response = requests.post(self.base_url + "deleteAccount")
        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            response.json()["message"], "Missing email in Delete Request API call")

    def testValidDeletion(self):
        try:
            email = "mysampleemail02@gmail.com"
            body = {"firstName": "sample", "lastName": "user",
                    "email": email, "password": "Fr3shFrU1t!"}
            create_response = requests.post(self.base_url + "signup", body)
            self.assertEqual(create_response.status_code, 200)
            delete_body = {"email": email}
            delete_response = requests.post(
                self.base_url + "delete", delete_body)
            self.assertEqual(delete_response.status_code, 200)
            self.assertEqual(delete_response.json()[
                             "message"], "Successfully deleted account")
        except:
            self.collection.delete_one({"email": email})
