import time
import requests
import json
import unittest
import random
import string
import pymongo
from decouple import config


class Test_Backend(unittest.TestCase):

    TEST_USER_EMAIL = "myemail5@gmail.com"
    TEST_USER_PASSWORD = "Mypassword5!"

    @classmethod
    def setUpClass(self) -> None:
        self.base_url = "http://localhost:9000/"
        connectionString = config("CONNECTION_STRING")
        client = pymongo.MongoClient(connectionString)
        db = client['test']
        self.collection = db['users']

        self.session = requests.Session()
        self.session.post("http://localhost:9000/signup", {"email": self.TEST_USER_EMAIL,
                          "password": self.TEST_USER_PASSWORD, "firstName": "firstname5", "lastName": "lastname5"})
        resp = self.session.post("http://localhost:9000/signIn",
                                 {"email": self.TEST_USER_EMAIL, "password": self.TEST_USER_PASSWORD})
        token = resp.json()["data"]["token"]
        self.session.headers.update({"Authorization": "JWT " + token})

    @classmethod
    def tearDownClass(self) -> None:
        self.collection.delete_one({"email": self.TEST_USER_EMAIL})
        self.session.close()

    def testNoUserProvided(self):
        new_session = requests.Session()
        response = new_session.delete(self.base_url + "deleteAccount/profile")
        self.assertEqual(response.status_code, 401)
        self.assertEqual(response.json()["message"], "Please log in first.")
        new_session.close()

    def testDoubleDelete(self):
        new_session = requests.Session()
        new_email = "myemail6@gmail.com"
        new_password = "Mypassword6!"
        new_session.post(
            "http://localhost:9000/signup",
            {
                "email": new_email,
                "password": new_password,
                "firstName": "Charles",
                "lastName": "Barkley"
            }
        )
        signin = new_session.post(
            "http://localhost:9000/signIn",
            {
                "email": new_email,
                "password": new_password
            }
        )
        token = signin.json()["data"]["token"]
        new_session.headers.update({"Authorization": "JWT " + token})

        time.sleep(1)

        first_delete = new_session.delete(
            self.base_url + "deleteAccount/profile")
        self.assertEqual(first_delete.status_code, 200)
        self.assertEqual(first_delete.json()[
                         "message"], "Successfully deleted account")

        time.sleep(1)

        second_delete = new_session.delete(
            self.base_url + "deleteAccount/profile")
        self.assertEqual(second_delete.status_code, 401)
        self.assertEqual(second_delete.json()[
                         "message"], "Please log in first.")
        new_session.close()

    def testValidDeletion(self):
        delete_response = self.session.delete(
            self.base_url + "deleteAccount/profile")
        self.assertEqual(delete_response.status_code, 200)
        self.assertEqual(delete_response.json()[
                         "message"], "Successfully deleted account")
