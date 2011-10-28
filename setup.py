#!/usr/bin/env python
import distribute_setup
distribute_setup.use_setuptools()

import sys
from setuptools import setup, find_packages

version = '3.0'

if sys.version_info[:2] < (2,4):
    print("NETWAYS Grapher requires Python version 2.4 or later.")
    sys.exit(1)

setup(name="ingraph",
      version=version,
      description="Data collection and graphing utility for monitoring systems",
      author="Gunnar Beutner <gunnar.beutner@netways.de>",
      author_email="gunnar.beutner@netways.de",
      url="N/A",
      packages = ["ingraph.bin", "ingraph"],
      scripts = ["ingraph-daemon", "ingraph-file-collector",
                 "ingraph-import-grapherv2", "ingraph-stop",
                 "ingraph-collectord"],
      install_requires = ["sqlalchemy>=0.6.3"],
      entry_points = {
        'console_scripts': ('ingraphd = ingraph.bin.ingraphd:main',)
    })
