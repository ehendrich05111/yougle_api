import os

test_suites = [
    "searchHistory-test.py",
    "backend-test.py",
    "resetPassword-test.py",
    "disconnectService-test.py",
    "saveMessage-test.py"
]

command = "python -m unittest "

for suite in test_suites:
    command += suite
    command += " "

os.system(command)