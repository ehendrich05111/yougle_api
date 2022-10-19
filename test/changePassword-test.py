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
        self.base_url = "http://localhost:9000/changePassword"
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
        response = requests.post(self.base_url, {"userID": userID, "oldPassword": "old password", "newPassword": "new password"})
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json()["message"], "No user with that ID")

    def testIncorrectOldPassword(self):
        try:
            userID = bson.ObjectId(''.join(random.choices(string.digits, k = 24)))
            self.collection.insert_one({"_id": userID, "password": "test password"})
            response = requests.post(self.base_url, {"userID": userID, "oldPassword": "wrong password", "newPassword": "new password"})
            self.assertEqual(response.status_code, 401)
            self.assertEqual(response.json()["message"], "Incorrect old password")
            self.collection.delete_one({"_id": userID})
        except:
            self.collection.delete_one({"_id": userID})
            self.assertTrue(False)

    def testInvalidNewPassword(self):
        try:
            email = ''.join(random.choices(string.ascii_letters, k = 12))
            body = { "firstName": "test", "lastName": "user", "email": email, "password": "password1!"}
            requests.post("http://localhost:9000/signup", body)
            test_user = self.collection.find_one({"email": email})
            response = requests.post(self.base_url, {"userID": test_user["_id"], "oldPassword": "password1!", "newPassword": "test"})
            self.assertEqual(response.status_code, 400)
            self.assertEqual(response.json()["message"], "Invalid password. Must be 8 characters or longer, contain a mix of letters, numbers, and symbols, and not contain email or name.")
            self.collection.delete_one({"email": email})
        except:
            self.collection.delete_one({"email": email})
            self.assertTrue(False)

    def testSameNewPassword(self):
        try:
            email = ''.join(random.choices(string.ascii_letters, k = 12))
            body = { "firstName": "test", "lastName": "user", "email": email, "password": "password1!"}
            requests.post("http://localhost:9000/signup", body)
            test_user = self.collection.find_one({"email": email})
            response = requests.post(self.base_url, {"userID": test_user["_id"], "oldPassword": "password1!", "newPassword": "password1!"})
            self.assertEqual(response.status_code, 400)
            self.assertEqual(response.json()["message"], "New password can not be the same as old password")
            self.collection.delete_one({"email": email})
        except:
            self.collection.delete_one({"email": email})
            self.assertTrue(False)

    def testSuccess(self):
        try:
            email = ''.join(random.choices(string.ascii_letters, k = 12))
            body = { "firstName": "test", "lastName": "user", "email": email, "password": "password1!"}
            requests.post("http://localhost:9000/signup", body)
            test_user = self.collection.find_one({"email": email})
            response = requests.post(self.base_url, {"userID": test_user["_id"], "oldPassword": "password1!", "newPassword": "password2!"})
            self.assertEqual(response.status_code, 200)
            verify_result = requests.post("http://localhost:9000/signin", {"email": email, "password": "password1!"})
            self.assertEqual(verify_result.json()["status"], "error")
            self.assertEqual(verify_result.json()["message"], "Incorrect email or password.")
            verify_result = requests.post("http://localhost:9000/signin", {"email": email, "password": "password2!"})
            self.assertEqual(verify_result.json()["status"], "success")
            self.collection.delete_one({"email": email})
        except:
            self.collection.delete_one({"email": email})
            self.assertTrue(False)
