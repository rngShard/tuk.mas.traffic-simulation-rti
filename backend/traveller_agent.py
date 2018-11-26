import asyncio

from spade.agent import Agent
from spade.behaviour import FSMBehaviour, State

from traveller import Traveller
from util import build_message, get_timestamp

SUPERVISOR_AGENT = "supervisor@localhost"

STATE_SPAWN = "STATE_SPAWN"
STATE_GET_ROUTE = "STATE_GET_ROUTE"
STATE_RECEIVE_ROUTE = "STATE_RECEIVE_ROUTE"
STATE_EDGE_START = "STATE_EDGE_START"
STATE_DRIVE = "STATE_DRIVE"
STATE_EDGE_END = "EDGE_END"
STATE_ARRIVED = "STATE_ARRIVED"
STATE_FINAL = "STATE_FINAL"


class TravellerBehaviour(FSMBehaviour):
    async def on_start(self):
        await asyncio.sleep(0)

    async def on_end(self):
        print(f"Stopping Agent {self.agent.name}")
        msg = build_message("inform", "despawn", self.agent.name, get_timestamp(), SUPERVISOR_AGENT)
        await self.send(msg)
        self.agent.stop()


class StateSpawn(State):
    async def run(self):
        msg = build_message("inform", "spawn", self.agent.name,
                            f"{get_timestamp()}|{self.agent.traveller.current_node}|"
                            f"{self.agent.traveller.agent_type}", SUPERVISOR_AGENT)
        await self.send(msg)
        await asyncio.sleep(0)
        self.set_next_state(STATE_GET_ROUTE)


class StateGetRoute(State):
    async def run(self):
        if self.agent.traveller.agent_type == "global":
            msg = build_message("request", "get_route", self.agent.name,
                                f"{self.agent.traveller.current_node}"
                                f"|{self.agent.traveller.destination_node}|{self.agent.traveller.init_state}",
                                SUPERVISOR_AGENT)
            await self.send(msg)
        elif self.agent.traveller.agent_type == "local":

            if self.agent.traveller.init_state:
                msg = build_message("request", "get_speed", self.agent.name, f"{self.agent.traveller.current_node}"
                                                                             f"|{self.agent.traveller.next_node}"
                                                                             f"|{self.agent.traveller.init_state}"
                                                                             f"|{self.agent.traveller.get_route_travel_times()}"
                                                                             f"|{self.agent.traveller.route}",
                                    SUPERVISOR_AGENT)
            else:
                msg = build_message("request", "get_speed", self.agent.name, f"{self.agent.traveller.current_node}"
                                                                             f"|{self.agent.traveller.next_node}"
                                                                             f"|{self.agent.traveller.init_state}"
                                                                             f"|{self.agent.traveller.get_route_travel_times()}"
                                                                             f"|{self.agent.traveller.route[self.agent.traveller.node_count-1:]}",
                                    SUPERVISOR_AGENT)
            await self.send(msg)

        self.agent.traveller.init_state = False
        await asyncio.sleep(0)
        self.set_next_state(STATE_RECEIVE_ROUTE)


class StateReceiveRoute(State):
    async def run(self):
        if self.agent.traveller.agent_type == "global":
            msg = await self.receive(timeout=10)

            msg_body = msg.body.split("|")
            next_node = int(msg_body[0])
            speed = msg_body[1].split(".")[0]
            speed = int(speed)
            self.agent.traveller.set_next_node(next_node)
            self.agent.traveller.set_current_speed(speed)
        elif self.agent.traveller.agent_type == "local":
            msg = await self.receive(timeout=10)
            speed = float(msg.body)
            if self.agent.traveller.next_node == self.agent.traveller.destination_node:
                self.agent.traveller.final_edge = True
            else:
                self.agent.traveller.final_edge = False
            self.agent.traveller.set_current_speed(speed)
        await asyncio.sleep(0)
        self.set_next_state(STATE_EDGE_START)


class StateEdgeStart(State):
    async def run(self):
        if self.agent.traveller.agent_type == "global":
            msg = build_message("inform", "edge_start", self.agent.name,
                                f"{get_timestamp()}|{self.agent.traveller.current_node}|"
                                f"{self.agent.traveller.next_node}|"
                                f"{self.agent.traveller.agent_type}", SUPERVISOR_AGENT)
        elif self.agent.traveller.agent_type == "local":
            msg = build_message("inform", "edge_start", self.agent.name,
                                f"{get_timestamp()}|{self.agent.traveller.current_node}|"
                                f"{self.agent.traveller.next_node}|"
                                f"{self.agent.traveller.agent_type}|"
                                f"{self.agent.traveller.get_estimated_travel_time()}", SUPERVISOR_AGENT)
        await self.send(msg)
        await asyncio.sleep(0)
        self.set_next_state(STATE_DRIVE)


class StateDrive(State):
    async def run(self):
        await asyncio.sleep(self.agent.traveller.get_travel_time())
        await asyncio.sleep(0)
        # while self.agent.traveller.travelled_edge_distance < self.agent.traveller.current_edge_distance:
        #    self.agent.traveller.drive()
        #    await asyncio.sleep(self.agent.traveller.curent_speed / 1000)
        self.set_next_state(STATE_EDGE_END)


class StateEdgeEnd(State):
    async def run(self):
        msg = build_message("inform", "edge_end", self.agent.name,
                            f"{self.agent.traveller.current_node}|"
                            f"{self.agent.traveller.next_node}", SUPERVISOR_AGENT)
        await self.send(msg)
        self.agent.traveller.current_node = self.agent.traveller.next_node
        if not self.agent.traveller.final_edge:
            self.agent.traveller.set_next_node()
        await asyncio.sleep(0)
        if self.agent.traveller.current_node == self.agent.traveller.destination_node or self.agent.traveller.final_edge:
            self.set_next_state(STATE_ARRIVED)
        else:
            self.set_next_state(STATE_GET_ROUTE)


class StateArrived(State):
    async def run(self):
        msg = build_message("inform", "arrived", self.agent.name, f"{get_timestamp()}|"
                                                                  f"{self.agent.traveller.current_node}",
                            SUPERVISOR_AGENT)
        print("arrived")
        await self.send(msg)
        await asyncio.sleep(0)
        self.agent.traveller.inc_route_count()
        if self.agent.traveller.route_count == self.agent.traveller.num_routes:
            self.set_next_state(STATE_FINAL)
        else:
            self.agent.traveller.destination_node = self.agent.traveller.choose_destination_node()
            self.set_next_state(STATE_SPAWN)


class StateFinal(State):
    async def run(self):
        await asyncio.sleep(0)
        print("Despawn")


class TravellerAgent(Agent):
    def __init__(self, host, pw, network, num_routes, agent_type="global", start_node=None, destination_node=None, loop=None):
        Agent.__init__(self, host, pw, loop=loop)
        self.traveller = Traveller(network, num_routes, agent_type, start_node, destination_node)

    def setup(self):
        print("TravellerAgent started")
        fsm = TravellerBehaviour()

        fsm.add_state(name=STATE_SPAWN, state=StateSpawn(), initial=True)
        fsm.add_state(name=STATE_GET_ROUTE, state=StateGetRoute())
        fsm.add_state(name=STATE_RECEIVE_ROUTE, state=StateReceiveRoute())
        fsm.add_state(name=STATE_EDGE_START, state=StateEdgeStart())
        fsm.add_state(name=STATE_DRIVE, state=StateDrive())
        fsm.add_state(name=STATE_EDGE_END, state=StateEdgeEnd())
        fsm.add_state(name=STATE_ARRIVED, state=StateArrived())
        fsm.add_state(name=STATE_FINAL, state=StateFinal())

        fsm.add_transition(STATE_SPAWN, STATE_GET_ROUTE)
        fsm.add_transition(STATE_GET_ROUTE, STATE_RECEIVE_ROUTE)
        fsm.add_transition(STATE_RECEIVE_ROUTE, STATE_EDGE_START)
        fsm.add_transition(STATE_EDGE_START, STATE_DRIVE)
        fsm.add_transition(STATE_DRIVE, STATE_EDGE_END)
        fsm.add_transition(STATE_EDGE_END, STATE_GET_ROUTE)
        fsm.add_transition(STATE_EDGE_END, STATE_ARRIVED)
        fsm.add_transition(STATE_ARRIVED, STATE_SPAWN)
        fsm.add_transition(STATE_ARRIVED, STATE_FINAL)

        self.add_behaviour(fsm)

        self.presence.subscribe(SUPERVISOR_AGENT)
