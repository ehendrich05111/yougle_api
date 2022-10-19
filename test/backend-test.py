import requests
import json
import unittest

#local_url = "http://localhost:9000/capitalize"

#options = {"textFieldString": "Hello"}

#response = requests.post(local_url, data=options)
#print(response.text)

class Test_Backend(unittest.TestCase):

    @classmethod
    def setUpClass(self) -> None:
        self.base_url = "http://localhost:9000/"

    def testCapitalize1(self):
        input_string = "This string should be capitalized"
        body = {"textFieldString": input_string}
        response = requests.post(self.base_url + "capitalize", data=body)
        self.assertEqual(input_string.upper(), response.text)

    def testCapitalize2(self):
        input_string = "24914jfCF@4fjf!$\%\%^fkfj!$3132144r5"
        body = {"textFieldString": input_string}
        response = requests.post(self.base_url + "capitalize", data=body)
        self.assertEqual(input_string.upper(), response.text)
    
    def testCapitalizeEmpty(self):
        input_string = ""
        body = {"textFieldString": input_string}
        response = requests.post(self.base_url + "capitalize", data=body)
        self.assertEqual(input_string.upper(), response.text)
    
    def testMissingBody(self):
        response = requests.post(self.base_url + "capitalize", data={})
        self.assertEqual(response.status_code, 500)