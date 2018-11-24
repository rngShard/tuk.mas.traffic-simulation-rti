from random import choice

import networkx as nx

from util import load_graph


class Traveller:

    def __init__(self, network, num_routes, agent_type, start_node=None, destination_node=None, max_speed=100, ):
        self.num_routes = num_routes
        self.route_count = 0
        self.agent_type = agent_type
        self.graph = load_graph(network)
        self.init_state = True
        self.max_speed = max_speed
        self.current_speed = max_speed
        self.travelled_edge_distance = 0
        self.current_edge_distance = 0
        self.next_node = None
        self.final_edge = False

        if start_node is not None and destination_node is not None:
            self.current_node = start_node
            self.destination_node = destination_node
        else:
            self.current_node = self.choose_start_node()
            self.destination_node = self.choose_destination_node()

        if self.agent_type == "local":
            self.route = self.get_route()
            self.node_count = 0
            self.set_next_node()

    def inc_route_count(self):
        self.route_count += 1

    def get_nodes(self):
        return self.graph.nodes

    def get_edges(self):
        return self.graph.edges

    def choose_start_node(self):
        return choice(list(self.graph.nodes))

    def choose_destination_node(self):
        destination_node = self.current_node
        while destination_node == self.current_node:
            destination_node = choice(list(self.graph.nodes))
        return destination_node

    def get_next_node(self):
        return self.next_node

    def set_next_node(self, node=None):
        if self.agent_type == "global":
            self.next_node = node
        elif self.agent_type == "local":
            self.node_count += 1
            self.next_node = self.route[self.node_count]

    def set_current_speed(self, speed):
        self.current_speed = speed

    def get_current_speed(self):
        return self.current_speed

    def get_current_edge_distance(self):
        distance = self.graph.get_edge_data(self.current_node, self.get_next_node())["distance"]
        return distance

    def get_travel_time(self):
        return self.get_current_edge_distance() / self.get_current_speed()

    def get_estimated_travel_time(self):
        return self.get_current_edge_distance() / self.max_speed

    def get_route(self):
        path = nx.shortest_path(self.graph, self.current_node, self.destination_node, "distance")
        return path

    def get_route_travel_time(self, node_i, node_j):
        if self.current_node == node_i and self.next_node == node_j:
            return self.graph[node_i][node_j]["distance"] / self.get_current_speed()
        else:
            return self.graph[node_i][node_j]["distance"] / self.max_speed

    def get_route_travel_times(self):
        travel_times = []
        for key, node in enumerate(self.route):
            try:
                next_node = self.route[key + 1]
            except IndexError:
                break
            travel_time = self.get_route_travel_time(node, next_node)
            travel_times.append(travel_time)
        return travel_times

    def drive(self):
        self.travelled_edge_distance += self.current_speed
