import {
  Box,
  Button,
  Center,
  Flex,
  grid,
  Heading,
  Image,
  Input,
  SimpleGrid,
  Text,
} from '@chakra-ui/react';
import { Alchemy, Network, Utils } from 'alchemy-sdk';
import { useState } from 'react';

function App() {
  const [userAddress, setUserAddress] = useState('');
  const [results, setResults] = useState([]);
  const [hasQueried, setHasQueried] = useState(false);
  const [tokenDataObjects, setTokenDataObjects] = useState([]);
  const [connectedAccount, setAccount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [queryError, setQueryError] = useState(false);

  async function getTokenBalance() {
    setIsLoading(true);
    const config = {
      apiKey: '',
      network: Network.ETH_MAINNET,
    };
    setQueryError(false);

    const alchemy = new Alchemy(config);
    try {    
      const data = await alchemy.core.getTokenBalances(userAddress);

      setResults(data);

      console.log(data);

      const tokenDataPromises = [];

      for (let i = 0; i < data.tokenBalances.length; i++) {
        const tokenData = alchemy.core.getTokenMetadata(
          data.tokenBalances[i].contractAddress
        );
        tokenDataPromises.push(tokenData);
      }

      setTokenDataObjects(await Promise.all(tokenDataPromises));
      setHasQueried(true);

    } catch (e) {console.error(e);
      setQueryError(true);
    } finally {
      setIsLoading(false); 
    }
  }

  async function connectWallet(){
    if (window.ethereum) {
      try {
          const accounts = await window.ethereum.request({ method: 'eth_requestAccounts', });
          return accounts[0];
      } catch (error) { console.error('User rejected connection or there was an error:', error); }
    } else { console.error('No Ethereum provider detected. Install MetaMask.'); }
  }

  async function getTokenBalanceFromWallet() {

    setIsLoading(true);
    const config = {
      apiKey: '',
      network: Network.ETH_MAINNET,
    };
    setQueryError(false);    
    const account = await connectWallet();

    console.log(account);


    const alchemy = new Alchemy(config);
    const data = await alchemy.core.getTokenBalances(account);

    setResults(data);

    const tokenDataPromises = [];

    for (let i = 0; i < data.tokenBalances.length; i++) {
      const tokenData = alchemy.core.getTokenMetadata(
        data.tokenBalances[i].contractAddress
      );
      tokenDataPromises.push(tokenData);
    }

    setTokenDataObjects(await Promise.all(tokenDataPromises));
    setHasQueried(true);
    setAccount(account);
    setIsLoading(false);
  }



  return (
    <Box w="100vw">
      {
        connectedAccount != '' && (
          <Flex
            position={"absolute"}
            top={4}
            right={4}
            bg={'gray.700'}
            color={'white'}
            p={'2%'}
            borderRadius={'md'}
            alignItems={'center'}
          >
          <Text fontSize="sm" fontWeight="bold" mr={10}>
            {connectedAccount.slice(0, 6)}...{connectedAccount.slice(-4)}
          </Text>
          <Button
            size="sm"
            color="red"
            onClick={() => (setAccount(''), setHasQueried(false), setTokenDataObjects([]), setIsLoading(false))} 
          >
            Disconnect
          </Button>

          </Flex>
        )
      }

      { !connectedAccount && hasQueried && (
          <Flex
            position={"absolute"}
            top={4}
            right={4}
            bg={'gray.700'}
            color={'white'}
            p={'2%'}
            borderRadius={'md'}
            alignItems={'center'}
          >
          <Button
            size="md"
            color="yellow"
            bg="green"
            onClick={() => (setHasQueried(false), setTokenDataObjects([]), setIsLoading(false))} 
          >
            New Query
          </Button>

          </Flex>
        )
      }

      {/* Layout principale */}
    { !hasQueried && ( 
      <Center>
        <Flex
          alignItems={'center'}
          justifyContent="center"
          flexDirection={'column'}
        >
          <Heading mb={0} fontSize={36}>
            ERC-20 Token Indexer
          </Heading>
          <Text>
            Plug in an address and this website will return all of its ERC-20
            token balances!
          </Text>

          <Heading mt={42}>
          Get all the ERC-20 token balances of this address:
        </Heading>
        <Input
          onChange={(e) => setUserAddress(e.target.value)}
          color="black"
          w="600px"
          textAlign="center"
          p={4}
          bgColor="white"
          fontSize={24}
        />
        <Button fontSize={20} onClick={getTokenBalance} mt={36} bgColor="blue">
          Check ERC-20 Token Balances
        </Button>

        <Heading mt={32}>
          Or
        </Heading> 
        
        <Button fontSize={20} onClick={getTokenBalanceFromWallet} mt={20} bgColor="orange">
          Connect your Wallet
        </Button>
        </Flex>
        
      </Center>
    )}
    {queryError && (
    <Center>
      <Text fontSize="xl" color="red" fontWeight="bold" m="2%">
        Error: Unable to fetch token balances. Please check the address and try again.
      </Text>
    </Center>
    )}
      <Flex
        w="100%"
        flexDirection="column"
        alignItems="center"
        justifyContent={'center'}
      >

        <Heading my={36}>ERC-20 token balances:</Heading>

        {isLoading ? (
          <Center>
            <Text fontSize="x1" color="gray">Loading...</Text>
          </Center>
        ) : hasQueried ? (
          <SimpleGrid w={'80vw'} columns={5} spacing={64}>
            {results.tokenBalances.map((e, i) => {
              return (
                <Flex
                  flexDir={'column'}
                  color="white"
                  bg="blue"
                  w={'10vw'}
                  key={e.id}
                >
                  <Box>
                    <b>Symbol:</b> ${tokenDataObjects[i].symbol}&nbsp;
                  </Box>
                  <Box>
                    <b>Balance:</b>&nbsp;
                    {parseFloat(Utils.formatUnits(e.tokenBalance, tokenDataObjects[i].decimals)).toFixed(4)}
                  </Box>
                  <Image src={tokenDataObjects[i].logo} />
                </Flex>
              );
            })}
          </SimpleGrid>
        ) : (
          'Please make a query! This may take a few seconds...'
        )}
      </Flex>
    </Box>
  );
}

export default App;
