import { test, rs, describe, expect } from '@rstest/core';
import { vol } from "memfs";
import { fileExists } from '../src/dir';
import { afterEach } from 'node:test';

rs.mock("fs", () => require('memfs'))
rs.mock('fs/promises', () => require('memfs').promises)

describe('fsHelper', () => {
  afterEach(() => {
    vol.reset()
  })

  test('test fsHelper', () => {
    vol.fromJSON({ "file-dat": "hello-world" }, "/etc/config");
    expect(fileExists()).toBe(true)
  });

})
