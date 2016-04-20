"""
Classes to import data from source files
"""
import re
import logging
import csv
from itertools import count
import os.path

class SourceFile(object):
    """
    Class representing a source file.
    """

    def __init__(self, path, preview_limit):

        self.path = path

        # The name should not contain extension as dots are not allowed in rdf names
        self.name = os.path.splitext(os.path.basename(path))[0]
        # FIXME check name uniqueness as we remove extension (collision if uploading example.tsv and example.txt)

        self.preview_limit = preview_limit

        self.log = logging.getLogger(__name__)

    def get_headers(self, delimiter='\t'):
        """
        Read and return the column headers.

        :param delimiter: the character delimiting columns.
        :return: a List of column headers
        :rtype: List
        """

        headers = []
        with open(self.path, 'r') as tabfile:
            # Load the file with reader
            tabreader = csv.reader(tabfile, delimiter=delimiter)

            # first line is header
            headers = next(tabreader)
            if headers[0].startswith('#'):
                headers[0] = re.sub('^#+', '', s) # Remove leading comment signs

        return headers

    def get_preview_data(self, delimiter='\t'):
        """
        Read and return the values from the first lines of file.

        :param delimiter: the character delimiting columns.
        :return: a List of List of column values
        :rtype: List
        """

        with open(self.path, 'r') as tabfile:
            # Load the file with reader
            tabreader = csv.reader(tabfile, delimiter=delimiter)

            count = 0

            next(tabreader) # Skip header

            # Loop on lines
            data = []
            for row in tabreader:

                if not data:
                    data = [[] for x in range(len(row))]

                # skip commented lines (# char at the begining)
                if row[0].startswith('#'):
                    continue

                # Fill data lists
                for i, val in enumerate(row):
                    data[i].append(val)

                # Stop after x lines
                count += 1
                if count > self.preview_limit:
                    break

        return data

    def guess_column_types(self, columns):
        """
        For each column given, return a guessed column type

        :param columns: List of List of values
        :return: List of guessed column types
        """

        types = []
        for col in columns:
            types.append(self.guess_values_type(col))

        return types

    def guess_values_type(self, values):
        """
        From a list of values, guess the data type

        :param values: a List of values to evaluate
        :return: the guessed type ('numeric', 'text' or 'category'
        """

        # First check if category
        if len(set(values)) < len(values) / 2:
            return 'category'

        # Then numeric
        num = True
        for val in values:
            num = num and self.is_decimal(val)

        if num:
            return 'numeric'

        # default is text
        return 'text'

    def is_decimal(self, value):
        """
        Determine if given value is a decimal (integer or float) or not

        :param value: the value to evaluate
        :return: True if the value is decimal
        """
        if value.isdigit():
            return True
        else:
            try:
                float(value)
                return True
            except ValueError:
                return False
