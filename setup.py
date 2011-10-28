#!/usr/bin/env python
#!/usr/bin/env python
import sys
import distribute_setup
distribute_setup.use_setuptools()
from setuptools import setup

import ingraph

console_scripts = ['ingraphd = ingraph.bin.ingraphd:main',
                   'ingraph-collectord = ingraph.bin.ingraph_collectord:main']
setup(name=ingraph.__name__,
      version=ingraph.__version__,
      description="Data collection and graphing utility for monitoring systems",
      author=ingraph.__author__,
      author_email=ingraph.__contact__,
      url=ingraph.__url__,
      install_requires=['sqlalchemy>=0.6.3'],
      packages=['ingraph.bin', 'ingraph'],
      entry_points={
        'console_scripts': console_scripts
      })