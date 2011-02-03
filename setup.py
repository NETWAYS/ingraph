#!/usr/bin/env python
import sys, os
from distutils.core import setup

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
      scripts = ["grapher-daemon", "file-collector", "import-grapherv2"])