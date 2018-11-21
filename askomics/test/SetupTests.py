import os
from shutil import copyfile

class SetupTests():

    def __init__(self, settings, session):


        # Create the user dir if not exist
        self.temp_directory = settings['askomics.files_dir'] + '/' + session['username'] + '/upload/'
        if not os.path.isdir(self.temp_directory):
            os.makedirs(self.temp_directory)
        # Set the upload dir
        session['upload_directory'] = self.temp_directory
        # Copy files if directory is empty
        if not os.listdir(self.temp_directory):
            files = ['people.tsv', 'instruments.tsv', 'play_instrument.tsv', 'transcript.tsv', 'qtl.tsv', 'small_data.gff3', 'turtle_data.ttl', 'bed_example.bed']
            for file in files:
                src = os.path.join(os.path.dirname(__file__), "..", "test-data") + '/' + file
                dst = session['upload_directory'] + file
                copyfile(src, dst)