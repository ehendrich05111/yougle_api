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
        self.base_url = "http://localhost:9000/resetPassword/"
        connectionString = config("CONNECTION_STRING")
        client = pymongo.MongoClient(connectionString)
        db = client['test']
        self.collection = db['users']

    def testMissingBodyRequestReset(self):
      response = requests.post(self.base_url + "requestReset", {})
      self.assertEqual(response.status_code, 400)
      self.assertEqual(response.json()["message"], "Error with user information")

    def testNoUserRequestReset(self):
      response = requests.post(self.base_url + "requestReset", { "email": "nonexistentemail@mail.com" })
      self.assertEqual(response.status_code, 400)
      self.assertEqual(response.json()["message"], "A user with that email does not exist")
    
    def testSuccessRequestReset(self):
        try:
            email = ''.join(random.choices(string.ascii_letters, k = 12)) + "@gmail.com"
            body = { "firstName": "test", "lastName": "user", "email": email, "password": "test_password"}
            self.collection.insert_one(body)
            response = requests.post(self.base_url + "requestReset", { "email": email })
            self.assertEqual(response.status_code, 200)
            self.assertEqual(response.json()["message"], "Password reset email sent")
            user = self.collection.find_one({"email": email})
            self.assertTrue(user["tempKey"] != None)
            self.collection.delete_one({"email": email})
        except:
            self.collection.delete_one({"email": email})
            self.assertTrue(False)


    def testMissingBodyResetPassword(self):
      response = requests.post(self.base_url, {})
      self.assertEqual(response.status_code, 400)
      self.assertEqual(response.json()["message"], "Error with user information")

    def testNoUserResetPassword(self):
      response = requests.post(self.base_url, { "email": "nonexistentemail@mail.com", "code": "temp", "newPassword": "temp" })
      self.assertEqual(response.status_code, 400)
      self.assertEqual(response.json()["message"], "A user with that email does not exist")

    def testWrongCodeResetPassword(self):
        try:
            email = ''.join(random.choices(string.ascii_letters, k = 12))
            body = { "firstName": "test", "lastName": "user", "email": email, "password": "test_password", "tempKey": {"code": "fakeKey", "expiresAt": "9999-01-01T00:00:00.000Z"}}
            self.collection.insert_one(body)
            response = requests.post(self.base_url, { "email": email, "code": "wrongCode", "newPassword": "newPassword"})
            self.assertEqual(response.status_code, 400)
            self.assertEqual(response.json()["message"], "Incorrect reset code")
            self.collection.delete_one({"email": email})
        except:
            self.collection.delete_one({"email": email})
            self.assertTrue(False)

    def testBadPasswordResetPassword(self):
        try:
            email = ''.join(random.choices(string.ascii_letters, k = 12))
            body = { "firstName": "test", "lastName": "user", "email": email, "password": "test_password", "tempKey": {"code": "resetCode", "expiresAt": "9999-01-01T00:00:00.000Z"}}
            self.collection.insert_one(body)
            response = requests.post(self.base_url, { "email": email, "code": "resetCode", "newPassword": "a"})
            self.assertEqual(response.status_code, 400)
            self.assertEqual(response.json()["message"], "Invalid password. Must be 8 characters or longer, contain a mix of letters, numbers, and symbols, and not contain email or name.")
            self.collection.delete_one({"email": email})
        except:
            self.collection.delete_one({"email": email})
            self.assertTrue(False)

    def testSuccessResetPassword(self):
        try:
            email = ''.join(random.choices(string.ascii_letters, k = 12))
            body = { "firstName": "test", "lastName": "user", "email": email, "password": "test_password", "tempKey": {"code": "resetCode", "expiresAt": "9999-01-01T00:00:00.000Z"}}
            self.collection.insert_one(body)
            response = requests.post(self.base_url, { "email": email, "code": "resetCode", "newPassword": "new_passwor1d!"})
            self.assertEqual(response.status_code, 200)
            self.assertEqual(response.json()["message"], "Password reset successful")
            self.collection.delete_one({"email": email})
        except:
            self.collection.delete_one({"email": email})
            self.assertTrue(False)

            

    