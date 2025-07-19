// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract DonationJar {

    struct Donation {
        address donator;
        address recipient;
        uint256 amount;
        string message;
        uint256 timestamp;
    }

    enum Rank { None, Supporter, Donator, Patron, Whale }

    Donation[] public donations;

    mapping(address => uint256) public totalDonated;

    event Donated(address indexed donator, address indexed recipient, uint256 amount, string message, uint256 timestamp);

    function addDonate(address recipient, string memory message) public payable {
        require(msg.value >= 0.001 ether, "Minimum donation is 0.01 ETH");
        require(recipient != address(0), "Recipient cannot be zero address");

        donations.push(Donation({
            donator: msg.sender,
            recipient: recipient,
            amount: msg.value,
            message: message,
            timestamp: block.timestamp
        }));

        totalDonated[msg.sender] += msg.value;

        (bool success, ) = recipient.call{value: msg.value}("");
        require(success, "ETH transfer failed");

        emit Donated(msg.sender, recipient, msg.value, message, block.timestamp);
    }

    function getRank(address user) public view returns (Rank) {
        uint256 total = totalDonated[user];

        if (total >= 5 ether) {
            return Rank.Whale;
        } else if (total >= 1 ether) {
            return Rank.Patron;
        } else if (total >= 0.1 ether) {
            return Rank.Donator;
        } else if (total >= 0.01 ether) {
            return Rank.Supporter;
        } else {
            return Rank.None;
        }
    }

    function getMyDonates() public view returns (Donation[] memory) {
        
        uint256 count = 0;
        for (uint256 i = 0; i < donations.length; i++) {
            if (donations[i].donator == msg.sender) {
                count++;
            }
        }

        Donation[] memory myDonations = new Donation[](count);

        uint256 index = 0;
        for (uint256 i = 0; i < donations.length; i++) {
            if (donations[i].donator == msg.sender) {
                myDonations[index] = donations[i];
                index++;
            }
        }

        return myDonations;
    }

    function getReceivedDonations() public view returns (Donation[] memory) {

        uint256 count = 0;
        for (uint256 i = 0; i < donations.length; i++) {
            if (donations[i].recipient == msg.sender) {
                count++;
            }
        }

        Donation[] memory receivedDonations = new Donation[](count);

        uint256 index = 0;
        for (uint256 i = 0; i < donations.length; i++) {
            if (donations[i].recipient == msg.sender) {
                receivedDonations[index] = donations[i];
                index++;
            }
        }

        return receivedDonations;
    } 
}