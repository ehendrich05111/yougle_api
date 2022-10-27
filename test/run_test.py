import os

test_suites = [
    "searchHistory-test.py",
    "backend-test.py",
    "resetPassword-test.py",
    "disconnectService-test.py",
    "saveMessage-test.py",
    "signIn-test.py",
    "signUp-test.py",
    "changeName-test.py",
    "changeEmail-test.py",
    "changePassword-test.py",
    "settings-test.py",
]

command = "python -m unittest "

for suite in test_suites:
    command += suite
    command += " "

os.system(command)