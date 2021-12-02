// SPDX-License-Identifier: MPL-2.0
pragma solidity =0.8.9;

import "@openzeppelin/contracts/utils/Strings.sol";
import "@devprotocol/util-contracts/contracts/utils/AddressLib.sol";
import "@devprotocol/util-contracts/contracts/utils/Base64.sol";
import "../../interface/ISTokensManager.sol";

contract STokensDescriptor {
	using Base64 for bytes;
	using AddressLib for address;
	using Strings for uint256;

	function getTokenURI(
		address _property,
		uint256 _amount,
		uint256 _cumulativeReward
	) internal pure returns (string memory) {
		string memory name = string(
			abi.encodePacked(
				"Dev Protocol sTokens - ",
				_property.toChecksumString(),
				" - ",
				_amount.toString(),
				" DEV",
				" - ",
				_cumulativeReward.toString()
			)
		);
		string memory description = string(
			abi.encodePacked(
				"This NFT represents a staking position in a Dev Protocol Property tokens. The owner of this NFT can modify or redeem the position.\\nProperty Address: ",
				_property.toChecksumString(),
				"\\n\\n\xE2\x9A\xA0 DISCLAIMER: Due diligence is imperative when assessing this NFT. Make sure token addresses match the expected tokens, as token symbols may be imitated."
			)
		);
		string memory image = string(
			abi.encodePacked(
				// solhint-disable-next-line quotes
				'<svg xmlns=\\"http://www.w3.org/2000/svg\\" width=\\"290\\" height=\\"500\\" viewBox=\\"0 0 290 500\\" fill=\\"none\\"><rect width=\\"290\\" height=\\"500\\" fill=\\"url(#paint0_linear)\\"/><path fill-rule=\\"evenodd\\" clip-rule=\\"evenodd\\" d=\\"M192 203H168.5V226.5V250H145H121.5V226.5V203H98H74.5V226.5V250V273.5H51V297H74.5H98V273.5H121.5H145H168.5H192V250V226.5H215.5H239V203H215.5H192Z\\" fill=\\"white\\"/><text fill=\\"white\\" xml:space=\\"preserve\\" style=\\"white-space: pre\\" font-family=\\"monospace\\" font-size=\\"11\\" letter-spacing=\\"0em\\"><tspan x=\\"27.4072\\" y=\\"333.418\\">',
				_property.toChecksumString(),
				// solhint-disable-next-line quotes
				'</tspan></text><defs><linearGradient id=\\"paint0_linear\\" x1=\\"0\\" y1=\\"0\\" x2=\\"290\\" y2=\\"500\\" gradientUnits=\\"userSpaceOnUse\\"><stop stop-color=\\"#00D0FD\\"/><stop offset=\\"0.151042\\" stop-color=\\"#4889F5\\"/><stop offset=\\"0.552083\\" stop-color=\\"#D500E6\\"/><stop offset=\\"1\\" stop-color=\\"#FF3815\\"/></linearGradient></defs></svg>'
			)
		);
		return
			string(
				abi.encodePacked(
					"data:application/json;base64,",
					bytes(
						abi.encodePacked(
							// solhint-disable-next-line quotes
							'{"name":"',
							name,
							// solhint-disable-next-line quotes
							'", "description":"',
							description,
							// solhint-disable-next-line quotes
							'", "image": "',
							"data:image/svg+xml;base64,",
							image,
							// solhint-disable-next-line quotes
							'"}'
						)
					).encode()
				)
			);
	}

	function getTokenURIChangedByAuthor(string _header, string _body)
		internal
		pure
		returns (string memory)
	{
		return string(abi.encodePacked(_header, _body));
	}
}
