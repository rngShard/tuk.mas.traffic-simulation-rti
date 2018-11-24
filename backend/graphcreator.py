import networkx as nx
import random
import json

# CAPACITIES = [5, 7, 10, 12, 15, 15, 20, 20, 20, 25, 25, 25, 25, 25, 25, 25, 40, 40 ,40 ,40 ,40 , 50, 50 ,50   ]
CAPACITIES = [1, 2, 2, 3, 3, 3, 5, 5, 5]


# CAPACITIES = [1, 2, 3, 4, 5]


class GraphCreator:

    def __init__(self, n, m):
        self.graph = nx.barabasi_albert_graph(n, m)
        self._init_distances()
        self._init_capacities()
        self._init_density()
        self._init_factors()

    def _init_distances(self):
        for u, v in self.graph.edges:
            self.graph[u][v]['distance'] = int(random.random() * 1000) + 1
            self.graph[u][v]['value'] = self.graph[u][v]["distance"] / 100

    def _init_capacities(self):
        for u, v in self.graph.edges:
            self.graph[u][v]['capacity'] = CAPACITIES[random.randrange(0, len(CAPACITIES))]

    def _init_density(self):
        for u, v in self.graph.edges:
            self.graph[u][v]["density"] = 0

    def _init_factors(self):
        for u, v in self.graph.edges:
            self.graph[u][v]["factor"] = None

    def save_graph(self, filename):
        data = nx.readwrite.node_link_data(self.graph)
        with open(filename, 'w') as outfile:
            json.dump(data, outfile)


if __name__ == "__main__":
    network = GraphCreator(30, 2)
    network.save_graph("../data/graphs/test_graph30_2.json")
