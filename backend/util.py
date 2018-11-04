from datetime import datetime
from networkx.readwrite.json_graph import node_link_graph
from spade.message import Message
import json


def get_timestamp():
    return str(datetime.now())


def load_graph(path2file):
    with open(path2file) as f:
        data = json.load(f)
    g = node_link_graph(data)
    return g


def build_message(performative, endpoint, name, body, to):
    msg = Message(to=to)  # Instantiate the message
    msg.set_metadata("performative", performative)  # Set the "inform" FIPA performative
    msg.set_metadata("endpoint", endpoint)
    msg.sender = name
    msg.body = body
    return msg
