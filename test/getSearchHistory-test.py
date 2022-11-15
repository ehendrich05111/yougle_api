import requests
import json
import unittest
import pymongo
from decouple import config


class Test_Backend(unittest.TestCase):
    TEST_USER_EMAIL = "mynewemail6@gmail.com"
    TEST_USER_PASSWORD = "mynewpassword6!"

    @classmethod
    def setUpClass(self):
        self.base_url = "http://localhost:9000/"
        connectionString = config("CONNECTION_STRING")
        client = pymongo.MongoClient(connectionString)
        db = client["test"]
        self.collection = db["users"]

        self.session = requests.Session()
        self.session.post(
            "http://localhost:9000/signup",
            {
                "email": self.TEST_USER_EMAIL,
                "password": self.TEST_USER_PASSWORD,
                "firstName": "firstname6",
                "lastName": "lastname6",
            },
        )
        resp = self.session.post(
            "http://localhost:9000/signIn",
            {"email": self.TEST_USER_EMAIL, "password": self.TEST_USER_PASSWORD},
        )
        token = resp.json()["data"]["token"]
        self.session.headers.update({"Authorization": "JWT " + token})

    @classmethod
    def tearDownClass(self) -> None:
        self.collection.delete_one({"email": self.TEST_USER_EMAIL})
        self.session.close()

    def testNoUserProvided(self):
        new_session = requests.Session()
        fail = new_session.get("http://localhost:9000/searchHistory/")
        self.assertEqual(fail.status_code, 401)
        fail = fail.json()
        self.assertEqual(fail["status"], "error")
        self.assertEqual(fail["message"], "Please log in first!")

        new_session.close()

    def testSuccessfulRetrieval(self):
        query1 = "testsearch1"
        query2 = "thequickbrownfoxjumpedoverthelazydog"
        query3 = "abracadabra"
        self.session.post("http://localhost:9000/searchHistory", {"query": query1})
        self.session.post("http://localhost:9000/searchHistory", {"query": query2})
        self.session.post("http://localhost:9000/searchHistory", {"query": query3})
        search_history = self.session.get("http://localhost:9000/searchHistory/")
        self.assertEqual(search_history.status_code, 200)
        search_history = search_history.json()
        self.assertEqual(len(search_history["data"]["history"]), 3)
        self.assertEqual(search_history["data"]["history"][0], query1)
        self.assertEqual(search_history["data"]["history"][1], query2)
        self.assertEqual(search_history["data"]["history"][2], query3)
