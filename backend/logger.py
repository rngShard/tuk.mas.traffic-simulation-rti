import os

PATH = "../data/sim_logs/"


def get_max_sim_log(graph_name, log_type):
    max_number = None
    for file_name in os.listdir(PATH):
        file__name_components = file_name.split("-")
        if file__name_components[1] == graph_name and file__name_components[2].split(".")[0] == log_type:
            if max_number is None:
                max_number = 0
            sim_num = int(file__name_components[0])
            if sim_num > max_number:
                max_number = sim_num
    if max_number is None:
        max_number = 0
    else:
        max_number += 1
    return max_number


def format_number(num):
    num = str(num)
    while len(num) != 3:
        num = "0" + num
    return num


class Logger:

    def __init__(self):
        self.log = []

    def write_log(self, graph_name, log_type):
        sim_num = format_number(get_max_sim_log(graph_name, log_type))
        with open(f"{PATH}{sim_num}-{graph_name}-{log_type}.log", 'w') as file:
            for line in self.log:
                file.write(f"{line}\n")



class CarLogger(Logger):
    def __init__(self):
        super().__init__()

    def log_spawn(self, agent_id, ts, start_node, agent_type):
        log_line = f"{ts} ; SPAWN ; {agent_id} ; {start_node} ; {agent_type}; "
        self.log.append(log_line)

    def log_enter(self, agent_id, ts, node_i, node_j, expected_travel_time, ):
        log_line = f"{ts} ; ENTER ; {agent_id} ; {node_i} ; {node_j} ; {int(expected_travel_time)}"
        self.log.append(log_line)

    def log_arrived(self, agent_id, ts, node):
        log_line = f"{ts} ; REACH ; {agent_id} ; {node}"
        self.log.append(log_line)

    def log_despawn(self, agent_id, ts):
        log_line = f"{ts} ; DESPAWN ; {agent_id}"
        self.log.append(log_line)


class PlannerLogger(Logger):

    def log_plan(self, keyword, agent_id, ts, route_nodes, travel_times):

        route_nodes = str(route_nodes)[1:-1].replace(" ", "")
        travel_times = [int(i) for i in travel_times]
        travel_times = str(travel_times)[1:-1].replace(" ", "")
        log_line = f"{ts} ; {keyword} ; {agent_id} ; {route_nodes} ; {travel_times}"
        self.log.append(log_line)


class EventLogger(Logger):

    def log_event(self, ts, node1, node2, factor):
        log_line = f"{ts} ; ({node1}-{node2}) ; {factor}"
        self.log.append(log_line)
