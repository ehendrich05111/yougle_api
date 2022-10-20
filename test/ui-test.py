from selenium import webdriver
from selenium.common.exceptions import WebDriverException
from selenium.webdriver.common.by import By

from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.desired_capabilities import DesiredCapabilities
from selenium.common.exceptions import StaleElementReferenceException
from selenium.common.exceptions import NoSuchElementException
import sys
import re
import time
import unittest

print("Before running the test suite, please make sure the backend and frontend are running in separate terminals")
print("Also make sure you have installed selenium")


class Test_UI(unittest.TestCase):

    @classmethod
    def setUpClass(self) -> None:
        try:
            options = Options()
            options.binary_location = "C:/Program Files/Google/Chrome/Application/chrome.exe"
            self.driver = webdriver.Chrome(chrome_options=options, executable_path="./chromedriver_win32/chromedriver.exe")
        except WebDriverException as e:
            print("Before running the test suite, make sure that your Google Chrome binary is in the right place")
        self.driver.get("http://localhost:3000")

    def testCapitalization1(self):
        search_bar = self.driver.find_element(By.ID, "searchbar")

        text_to_capitalize = "Hello"

        search_bar.send_keys(text_to_capitalize)
        submit_button = self.driver.find_element(By.ID, "clickme")
        submit_button.click()
        time.sleep(1)
        response_paragraph = self.driver.find_element(By.ID, "capitalizedText")
        response_text = response_paragraph.get_attribute("innerText")
        self.assertEqual(text_to_capitalize.upper(), response_text)

    def testCapitalization2(self):
        time.sleep(1)
        search_bar = self.driver.find_element(By.ID, "searchbar")
        search_bar.clear()

        text_to_capitalize = "Goodbye"

        search_bar.send_keys(text_to_capitalize)
        submit_button = self.driver.find_element(By.ID, "clickme")
        submit_button.click()
        time.sleep(1)
        response_paragraph = self.driver.find_element(By.ID, "capitalizedText")
        response_text = response_paragraph.get_attribute("innerText")
        self.assertEqual(text_to_capitalize.upper(), response_text)

    @classmethod
    def tearDownClass(self) -> None:
        self.driver.quit()
        