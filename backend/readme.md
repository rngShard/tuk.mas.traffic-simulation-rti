# Backend
The backend is tested in Ubuntu 18.04. It should also work in Ubuntu 16.04 or other distributions, but in Ubuntu 16.04, python3.6 has to be installed and the prosody config folder has a different structure.

## Setup
- If virtualenv is not installed:

```
sudo apt-get install virtualenv
```


1. Create a virtual python environment with python 3.6: 

```
cd tuk.mas.traffic-simulation-rti/backend/
virtualenv -p python3.6 venv
```

2. activate virtualenv:
```
source venv/bin/activate
```
3. install requirements:
```
pip install -r requirements.txt
```
4. install prosody: https://prosody.im/download/
```
sudo apt-get install prosody
```
5. copy the prosody config file into the prosody config folder (config folder location might depend on operating system)
```
sudo cp prosody/prosody.cfg.lua /etc/prosody/prosody.cfg.lua
```
6. generate ssl certificates (make sure the certs are in the location which is specified in the config file):
```
sudo prosodyctl cert generate localhost
```
7. start prosody:
```
sudo prosodyctl start
```
or if it was already running:
```
sudo prosodyctl restart
```

8. Prosody can be stopped with the following command:
```
sudo prosodyctl stop
```

## Creating Graphs
Run:
```
python graphcreator.py
```

## Running the simulation
Run:
```
python simulation.py
```
The simulation has to be stopped with strg + c.




