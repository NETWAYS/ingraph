#!/usr/bin/env python
import distribute_setup
distribute_setup.use_setuptools()

import sys
from setuptools import setup, find_packages

version = '3.0'

if sys.version_info[:2] < (2,5):
    print("NETWAYS Grapher requires Python version 2.5 or later.")
    sys.exit(1)

setup(name="netways_grapher",
      version=version,
      description="Data collection and graphing utility for monitoring systems",
      author="Gunnar Beutner <gunnar.beutner@netways.de>",
      author_email="gunnar.beutner@netways.de",
      url="N/A",
      packages = ["netways_grapher"],
      package_dir = {"netways_grapher": "src"},
      scripts = ["grapher-daemon", "grapher-file-collector", "grapher-importv2"],
      install_requires = ["sqlalchemy>=0.6.3"])
