// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "./interview.sol";

struct File {
    uint id;
    string name;
    string details;
    string hash ;
    mapping(address=>bool) canViewFile;
}

struct ReturnFile {
    uint id;
    string name ;
    string details;
    string hash ;
}

error ONLY_FOR_OWNERS();
error ONLY_INTERVIEWER_CAN_MANAGE_FILE_ACCESS();

contract Exchange {

    InterviewSBT public sbtFactory;
    mapping(address=>File[]) internal fileList;
    constructor(address _address){
     sbtFactory = InterviewSBT(_address);
    }
     

    function addFileList(address _addr,string memory _name , string memory _details , string memory _hash) external onlyOwner{
      uint newId = fileList[_addr].length;
      fileList[_addr].push();
      File storage file = fileList[_addr][newId];
      file.id = newId;
      file.name=_name;
      file.details=_details;
      file.hash=_hash;
      file.canViewFile[_addr]=true;
    }

    function allowAccess(uint _fileId, address _ownerAddr, address _newAddr) external onlyOwner{
        if(!sbtFactory.isInterviewer(_ownerAddr))
            revert ONLY_INTERVIEWER_CAN_MANAGE_FILE_ACCESS();
        File storage file = fileList[_ownerAddr][_fileId];
        file.canViewFile[_newAddr]=true;
    }

    function revokeAccess(uint _fileId, address _ownerAddr, address _newAddr) external onlyOwner{
        if(!sbtFactory.isInterviewer(_ownerAddr))
            revert ONLY_INTERVIEWER_CAN_MANAGE_FILE_ACCESS();
        File storage file = fileList[_ownerAddr][_fileId];
        file.canViewFile[_newAddr]=false;
    }

    function hasAccess(uint _fileId, address _ownerAddr, address _viewerAddr) external view returns(bool){
        return fileList[_ownerAddr][_fileId].canViewFile[_viewerAddr];
    }

    function getAllFilesByOwnerAddress(address _addr) external view returns (ReturnFile[] memory){
        File[] storage ownerFiles = fileList[_addr];
        ReturnFile[] memory files = new ReturnFile[](ownerFiles.length);
        for(uint i=0;i<ownerFiles.length;i++){
            files[i] = ReturnFile(ownerFiles[i].id,ownerFiles[i].name,ownerFiles[i].details,ownerFiles[i].hash);
        }
        return files;
    } 

    modifier onlyOwner{
        if (!(sbtFactory.isOwner(msg.sender) ) ){
            revert ONLY_FOR_OWNERS();
        }  
        _;   
    }
   

// 0xAb8483F64d9C6d1EcF9b849Ae677dD3315835cb2 -> interviewer
}