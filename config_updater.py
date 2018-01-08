import argparse
import configparser


def main():
    """Update ini entry of a config file"""

    parser = argparse.ArgumentParser(description='Update AskOmics config file')

    parser.add_argument('-p', '--path', type=str, help='Path to config file', required=True)
    parser.add_argument('-s', '--section', type=str, help='Section to add/update', required=True)
    parser.add_argument('-k', '--key', type=str, help='Key to add into the section', required=True)
    parser.add_argument('-v', '--value', type=str, help='Value of the key', required=True)

    args = parser.parse_args()

    path = args.path
    section = args.section
    key = args.key
    value = args.value

    config = configparser.ConfigParser()
    config.read(path)

    if section not in config.sections():
        config.add_section(section)

    config[section][key] = value
    config.write(open(path, 'w'))

if __name__ == '__main__':
    main()
