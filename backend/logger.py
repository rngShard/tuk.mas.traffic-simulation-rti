class Logger:

    def __init__(self):
        self.log = []

    def write_log(self, path):
        with open(path, 'w') as file:
            for line in self.log:
                file.write(f"{line}\n")


class CarLogger(Logger):
    def __init__(self):
        super().__init__()

    def log_spawn(self, agent_id, ts, start_node):
        log_line = f"{ts} ; SPAWN ; {agent_id} ; {start_node} ; LOCAL; "
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
